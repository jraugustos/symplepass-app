import { createClient } from '@/lib/supabase/server'
import { CouponFilters, CouponFormData, CouponValidationResult } from '@/types'

export async function getAllCoupons(filters: CouponFilters = {}) {
  try {
    const supabase = await createClient()
    const { status, event_id, search, page = 1, pageSize = 20 } = filters

    let query = supabase
      .from('coupons')
      .select(`
        *,
        events(id, title),
        profiles!coupons_created_by_fkey(id, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (search) {
      query = query.ilike('code', `%${search}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching coupons:', error)
      return { coupons: [], total: 0, page, pageSize }
    }

    return { coupons: data || [], total: count || 0, page, pageSize }
  } catch (error) {
    console.error('Error in getAllCoupons:', error)
    return { coupons: [], total: 0, page: 1, pageSize: 20 }
  }
}

export async function getCouponById(couponId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        events(id, title),
        profiles!coupons_created_by_fkey(id, full_name)
      `)
      .eq('id', couponId)
      .single()

    if (error) {
      console.error('Error fetching coupon:', error)
      return { coupon: null, error: error.message }
    }

    return { coupon: data, error: null }
  } catch (error) {
    console.error('Error in getCouponById:', error)
    return { coupon: null, error: 'Failed to fetch coupon' }
  }
}

export async function getCouponByCode(code: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error) {
      console.error('Error fetching coupon by code:', error)
      return { coupon: null, error: error.message }
    }

    return { coupon: data, error: null }
  } catch (error) {
    console.error('Error in getCouponByCode:', error)
    return { coupon: null, error: 'Failed to fetch coupon' }
  }
}

export async function validateCoupon(
  code: string,
  eventId: string,
  userId: string,
  categoryPrice: number
): Promise<CouponValidationResult> {
  try {
    const supabase = await createClient()

    // Fetch coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (fetchError || !coupon) {
      return { valid: false, error: 'Cupom não encontrado' }
    }

    // Check if coupon is active
    if (coupon.status !== 'active') {
      return { valid: false, error: 'Cupom inativo ou expirado' }
    }

    // Check validity dates
    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validUntil = new Date(coupon.valid_until)

    if (now < validFrom) {
      return { valid: false, error: 'Cupom ainda não está válido' }
    }

    if (now > validUntil) {
      return { valid: false, error: 'Cupom expirado' }
    }

    // Check if coupon is event-specific
    if (coupon.event_id && coupon.event_id !== eventId) {
      return { valid: false, error: 'Cupom não válido para este evento' }
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, error: 'Cupom esgotado' }
    }

    // Check if user already used this coupon for this event
    const { data: existingUsage } = await supabase
      .from('coupon_usages')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId)
      .limit(1)

    if (existingUsage && existingUsage.length > 0) {
      return { valid: false, error: 'Você já usou este cupom' }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (categoryPrice * coupon.discount_value) / 100
    } else {
      discountAmount = Math.min(coupon.discount_value, categoryPrice)
    }

    return {
      valid: true,
      coupon,
      discountAmount,
    }
  } catch (error) {
    console.error('Error in validateCoupon:', error)
    return { valid: false, error: 'Erro ao validar cupom' }
  }
}

export async function applyCoupon(
  couponId: string,
  userId: string,
  registrationId: string,
  discountApplied: number
) {
  try {
    const supabase = await createClient()

    // Insert coupon usage
    const { error: usageError } = await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        registration_id: registrationId,
        discount_applied: discountApplied,
      })

    if (usageError) {
      console.error('Error inserting coupon usage:', usageError)
      return { success: false, error: usageError.message }
    }

    // Increment current_uses
    const { error: updateError } = await supabase.rpc('increment_coupon_uses', {
      coupon_id: couponId,
    })

    if (updateError) {
      console.error('Error incrementing coupon uses:', updateError)
      // Note: Usage was already inserted, but counter wasn't incremented
      // In production, consider using a transaction or database trigger
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in applyCoupon:', error)
    return { success: false, error: 'Failed to apply coupon' }
  }
}

export async function createCoupon(couponData: CouponFormData, createdBy: string) {
  try {
    const supabase = await createClient()

    // Ensure code is uppercase
    const code = couponData.code.toUpperCase()

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        event_id: couponData.event_id || null,
        valid_from: couponData.valid_from,
        valid_until: couponData.valid_until,
        max_uses: couponData.max_uses || null,
        status: couponData.status,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return { coupon: null, error: error.message }
    }

    return { coupon: data, error: null }
  } catch (error) {
    console.error('Error in createCoupon:', error)
    return { coupon: null, error: 'Failed to create coupon' }
  }
}

export async function updateCoupon(couponId: string, couponData: Partial<CouponFormData>) {
  try {
    const supabase = await createClient()

    const updateData: any = {
      ...couponData,
      updated_at: new Date().toISOString(),
    }

    // Ensure code is uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase()
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single()

    if (error) {
      console.error('Error updating coupon:', error)
      return { coupon: null, error: error.message }
    }

    return { coupon: data, error: null }
  } catch (error) {
    console.error('Error in updateCoupon:', error)
    return { coupon: null, error: 'Failed to update coupon' }
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    const supabase = await createClient()

    // Check if coupon has been used
    const { data: usages, error: usageError } = await supabase
      .from('coupon_usages')
      .select('id')
      .eq('coupon_id', couponId)
      .limit(1)

    if (usageError) {
      console.error('Error checking coupon usages:', usageError)
      return { success: false, error: 'Failed to check coupon usages' }
    }

    if (usages && usages.length > 0) {
      // Instead of deleting, disable the coupon
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ status: 'disabled' })
        .eq('id', couponId)

      if (updateError) {
        console.error('Error disabling coupon:', updateError)
        return { success: false, error: updateError.message }
      }

      return { success: true, error: null }
    }

    // Safe to delete if never used
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId)

    if (deleteError) {
      console.error('Error deleting coupon:', deleteError)
      return { success: false, error: deleteError.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteCoupon:', error)
    return { success: false, error: 'Failed to delete coupon' }
  }
}

export async function getCouponUsages(couponId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('coupon_usages')
      .select(`
        *,
        profiles:user_id(full_name, email),
        registrations:registration_id(
          events:event_id(title),
          event_categories:category_id(name)
        )
      `)
      .eq('coupon_id', couponId)
      .order('used_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupon usages:', error)
      return { usages: [], error: error.message }
    }

    return { usages: data || [], error: null }
  } catch (error) {
    console.error('Error in getCouponUsages:', error)
    return { usages: [], error: 'Failed to fetch coupon usages' }
  }
}

export async function getCouponStats(couponId: string) {
  try {
    const supabase = await createClient()

    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('current_uses, max_uses')
      .eq('id', couponId)
      .single()

    if (couponError) {
      console.error('Error fetching coupon stats:', couponError)
      return null
    }

    const { data: usages, error: usagesError } = await supabase
      .from('coupon_usages')
      .select('discount_applied')
      .eq('coupon_id', couponId)

    if (usagesError) {
      console.error('Error fetching coupon usage stats:', usagesError)
      return null
    }

    const totalUses = coupon.current_uses || 0
    const maxUses = coupon.max_uses
    const totalDiscount = usages?.reduce((sum, u) => sum + Number(u.discount_applied), 0) || 0
    const averageDiscount = totalUses > 0 ? totalDiscount / totalUses : 0
    const usageRate = maxUses ? (totalUses / maxUses) * 100 : 0

    return {
      totalUses,
      maxUses,
      totalDiscount,
      averageDiscount,
      usageRate,
    }
  } catch (error) {
    console.error('Error in getCouponStats:', error)
    return null
  }
}
