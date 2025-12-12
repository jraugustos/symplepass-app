import { createClient } from '@/lib/supabase/server'
import type { PhotoPricingTier } from '@/types/database.types'

/**
 * Interface for creating a new pricing tier
 */
export interface CreatePricingTierData {
  event_id: string
  min_quantity: number
  price_per_photo: number
}

/**
 * Get all pricing tiers for an event
 * @param eventId - The event ID
 * @returns Array of pricing tiers ordered by min_quantity (ascending)
 */
export async function getPricingTiersByEventId(eventId: string): Promise<PhotoPricingTier[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photo_pricing_tiers')
      .select('*')
      .eq('event_id', eventId)
      .order('min_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching pricing tiers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPricingTiersByEventId:', error)
    return []
  }
}

/**
 * Get a single pricing tier by ID
 * @param tierId - The tier ID
 * @returns The pricing tier or null
 */
export async function getPricingTierById(tierId: string): Promise<PhotoPricingTier | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photo_pricing_tiers')
      .select('*')
      .eq('id', tierId)
      .single()

    if (error) {
      console.error('Error fetching pricing tier:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getPricingTierById:', error)
    return null
  }
}

/**
 * Create a new pricing tier
 * @param tierData - Tier data
 * @returns Created tier or error
 */
export async function createPricingTier(tierData: CreatePricingTierData) {
  try {
    const supabase = await createClient()

    // Validate data
    if (tierData.min_quantity <= 0) {
      return { data: null, error: 'Quantidade mínima deve ser maior que 0' }
    }

    if (tierData.price_per_photo < 0) {
      return { data: null, error: 'Preço por foto deve ser maior ou igual a 0' }
    }

    // Check if tier with same min_quantity already exists for this event
    const { data: existing } = await supabase
      .from('photo_pricing_tiers')
      .select('id')
      .eq('event_id', tierData.event_id)
      .eq('min_quantity', tierData.min_quantity)
      .single()

    if (existing) {
      return { data: null, error: `Já existe uma faixa de preço para ${tierData.min_quantity}+ fotos` }
    }

    // Get the next display_order for this event
    const { data: existingTiers } = await supabase
      .from('photo_pricing_tiers')
      .select('display_order')
      .eq('event_id', tierData.event_id)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextDisplayOrder = existingTiers && existingTiers.length > 0
      ? (existingTiers[0].display_order || 0) + 1
      : 0

    const { data, error } = await supabase
      .from('photo_pricing_tiers')
      .insert({
        ...tierData,
        display_order: nextDisplayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pricing tier:', error)
      // Check for unique constraint violation
      if (error.code === '23505') {
        return { data: null, error: `Já existe uma faixa de preço para ${tierData.min_quantity}+ fotos` }
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createPricingTier:', error)
    return { data: null, error: 'Falha ao criar faixa de preço' }
  }
}

/**
 * Update an existing pricing tier
 * @param tierId - Tier ID
 * @param tierData - Updated tier data
 * @param eventId - Event ID to verify tier belongs to event
 * @returns Updated tier or error
 */
export async function updatePricingTier(
  tierId: string,
  tierData: Partial<CreatePricingTierData>,
  eventId: string
) {
  try {
    const supabase = await createClient()

    // Verify tier belongs to event
    const { data: existing } = await supabase
      .from('photo_pricing_tiers')
      .select('event_id, min_quantity')
      .eq('id', tierId)
      .single()

    if (!existing || existing.event_id !== eventId) {
      return { data: null, error: 'Faixa de preço não encontrada ou não pertence a este evento' }
    }

    // Validate data
    if (tierData.min_quantity !== undefined && tierData.min_quantity <= 0) {
      return { data: null, error: 'Quantidade mínima deve ser maior que 0' }
    }

    if (tierData.price_per_photo !== undefined && tierData.price_per_photo < 0) {
      return { data: null, error: 'Preço por foto deve ser maior ou igual a 0' }
    }

    // Check if new min_quantity conflicts with another tier
    if (tierData.min_quantity !== undefined && tierData.min_quantity !== existing.min_quantity) {
      const { data: conflict } = await supabase
        .from('photo_pricing_tiers')
        .select('id')
        .eq('event_id', eventId)
        .eq('min_quantity', tierData.min_quantity)
        .neq('id', tierId)
        .single()

      if (conflict) {
        return { data: null, error: `Já existe uma faixa de preço para ${tierData.min_quantity}+ fotos` }
      }
    }

    const { data, error } = await supabase
      .from('photo_pricing_tiers')
      .update(tierData)
      .eq('id', tierId)
      .select()
      .single()

    if (error) {
      console.error('Error updating pricing tier:', error)
      if (error.code === '23505') {
        return { data: null, error: `Já existe uma faixa de preço para ${tierData.min_quantity}+ fotos` }
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updatePricingTier:', error)
    return { data: null, error: 'Falha ao atualizar faixa de preço' }
  }
}

/**
 * Delete a pricing tier
 * @param tierId - Tier ID
 * @returns Success or error
 */
export async function deletePricingTier(tierId: string) {
  try {
    const supabase = await createClient()

    // Check if tier is used in any paid orders
    const { data: orders, error: checkError } = await supabase
      .from('photo_orders')
      .select('id')
      .eq('applied_tier_id', tierId)
      .eq('payment_status', 'paid')
      .limit(1)

    if (checkError) {
      console.error('Error checking orders:', checkError)
      return { data: null, error: 'Falha ao verificar pedidos' }
    }

    if (orders && orders.length > 0) {
      return {
        data: null,
        error: 'Não é possível deletar uma faixa de preço que foi usada em pedidos pagos',
      }
    }

    const { error } = await supabase
      .from('photo_pricing_tiers')
      .delete()
      .eq('id', tierId)

    if (error) {
      console.error('Error deleting pricing tier:', error)
      return { data: null, error: error.message }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error in deletePricingTier:', error)
    return { data: null, error: 'Falha ao deletar faixa de preço' }
  }
}

/**
 * Reorder pricing tiers by updating their display_order
 * @param items - Array of tier IDs with their new display_order
 * @returns Success or error
 */
export async function reorderPricingTiers(items: { id: string; display_order: number }[]) {
  try {
    const supabase = await createClient()

    // Update all items in parallel
    const updates = items.map((item) =>
      supabase
        .from('photo_pricing_tiers')
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
    console.error('Error in reorderPricingTiers:', error)
    return { error: 'Falha ao reordenar faixas de preço' }
  }
}

/**
 * Batch create or update pricing tiers for an event
 * This is useful when saving all tiers at once from a form
 * @param eventId - The event ID
 * @param tiers - Array of tier data (with optional id for existing tiers)
 * @returns Success or error
 */
export async function savePricingTiers(
  eventId: string,
  tiers: Array<CreatePricingTierData & { id?: string }>
) {
  try {
    const supabase = await createClient()

    // Get existing tiers
    const { data: existingTiers } = await supabase
      .from('photo_pricing_tiers')
      .select('id')
      .eq('event_id', eventId)

    const existingIds = new Set(existingTiers?.map((t) => t.id) || [])
    const newTierIds = new Set(tiers.filter((t) => t.id).map((t) => t.id))

    // Find tiers to delete (exist in DB but not in new list)
    const tiersToDelete = [...existingIds].filter((id) => !newTierIds.has(id))

    // Check if any tiers to delete are used in paid orders
    if (tiersToDelete.length > 0) {
      const { data: ordersWithDeletedTiers } = await supabase
        .from('photo_orders')
        .select('applied_tier_id')
        .in('applied_tier_id', tiersToDelete)
        .eq('payment_status', 'paid')
        .limit(1)

      if (ordersWithDeletedTiers && ordersWithDeletedTiers.length > 0) {
        return {
          data: null,
          error: 'Não é possível remover faixas de preço que foram usadas em pedidos pagos',
        }
      }
    }

    // Delete removed tiers
    if (tiersToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('photo_pricing_tiers')
        .delete()
        .in('id', tiersToDelete)

      if (deleteError) {
        console.error('Error deleting pricing tiers:', deleteError)
        return { data: null, error: 'Falha ao remover faixas de preço' }
      }
    }

    // Upsert tiers
    const tiersToUpsert = tiers.map((tier, index) => ({
      id: tier.id || undefined,
      event_id: eventId,
      min_quantity: tier.min_quantity,
      price_per_photo: tier.price_per_photo,
      display_order: index,
    }))

    // Separate into inserts and updates
    const tiersToInsert = tiersToUpsert.filter((t) => !t.id)
    const tiersToUpdate = tiersToUpsert.filter((t) => t.id)

    // Insert new tiers
    if (tiersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('photo_pricing_tiers')
        .insert(tiersToInsert.map(({ id, ...rest }) => rest))

      if (insertError) {
        console.error('Error inserting pricing tiers:', insertError)
        if (insertError.code === '23505') {
          return { data: null, error: 'Faixas de preço duplicadas detectadas' }
        }
        return { data: null, error: 'Falha ao criar faixas de preço' }
      }
    }

    // Update existing tiers
    for (const tier of tiersToUpdate) {
      const { error: updateError } = await supabase
        .from('photo_pricing_tiers')
        .update({
          min_quantity: tier.min_quantity,
          price_per_photo: tier.price_per_photo,
          display_order: tier.display_order,
        })
        .eq('id', tier.id!)

      if (updateError) {
        console.error('Error updating pricing tier:', updateError)
        if (updateError.code === '23505') {
          return { data: null, error: 'Faixas de preço duplicadas detectadas' }
        }
        return { data: null, error: 'Falha ao atualizar faixas de preço' }
      }
    }

    // Fetch and return updated tiers
    const { data: updatedTiers, error: fetchError } = await supabase
      .from('photo_pricing_tiers')
      .select('*')
      .eq('event_id', eventId)
      .order('min_quantity', { ascending: true })

    if (fetchError) {
      console.error('Error fetching updated tiers:', fetchError)
      return { data: null, error: 'Falha ao buscar faixas atualizadas' }
    }

    return { data: updatedTiers, error: null }
  } catch (error) {
    console.error('Error in savePricingTiers:', error)
    return { data: null, error: 'Falha ao salvar faixas de preço' }
  }
}
