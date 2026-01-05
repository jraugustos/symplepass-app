import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Subscription, SubscriptionStatus } from '@/types/database.types'
import { CLUB_DISCOUNT_PERCENTAGE } from '@/lib/constants/club'

type SubscriptionResult<T> = {
  data: T | null
  error: string | null
}

type SupabaseServerClient = SupabaseClient<Database>

function getClient(providedClient?: SupabaseServerClient) {
  return providedClient ?? createClient()
}

/**
 * Creates or updates a subscription record after Stripe webhook events.
 * Uses admin client to bypass RLS since webhooks don't have user context.
 */
export async function upsertSubscription(
  userId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  status: SubscriptionStatus,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean = false,
  canceledAt: Date | null = null,
  metadata: Record<string, any> | null = null
): Promise<SubscriptionResult<Subscription>> {
  try {
    const supabase = createAdminClient()

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await (supabase.from('subscriptions') as any)
        .update({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          status,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          cancel_at_period_end: cancelAtPeriodEnd,
          canceled_at: canceledAt?.toISOString() ?? null,
          metadata,
        })
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating subscription:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    }

    // Create new subscription
    const { data, error } = await (supabase.from('subscriptions') as any)
      .insert({
        user_id: userId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        status,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: canceledAt?.toISOString() ?? null,
        metadata,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error upserting subscription:', error)
    return { data: null, error: 'Unable to upsert subscription' }
  }
}

/**
 * Gets the active subscription for a user.
 * Returns the subscription with status 'active' or 'trialing' and current_period_end in the future.
 */
export async function getActiveSubscription(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<SubscriptionResult<Subscription>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle()

    if (error) {
      console.error('Error fetching active subscription:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching active subscription:', error)
    return { data: null, error: 'Unable to fetch subscription' }
  }
}

/**
 * Gets a subscription by its Stripe subscription ID.
 * Used by webhooks to find and update subscriptions.
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<SubscriptionResult<Subscription>> {
  try {
    // Use admin client for webhook contexts where no user is authenticated
    const supabase = supabaseClient ?? createAdminClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching subscription by Stripe ID:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching subscription by Stripe ID:', error)
    return { data: null, error: 'Unable to fetch subscription' }
  }
}

/**
 * Checks if a user is an active club member.
 * Returns true if the user has an active subscription with valid period.
 */
export async function isClubMember(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<boolean> {
  try {
    const { data } = await getActiveSubscription(userId, supabaseClient)
    return data !== null
  } catch (error) {
    console.error('Error checking club membership:', error)
    return false
  }
}

/**
 * Club member discount result type
 */
export type ClubMemberDiscountResult = {
  isEligible: boolean
  discountAmount: number
  discountPercentage: number
}

/**
 * Gets the club member discount for a given subtotal.
 * Returns 10% discount if user is an active club member.
 */
export async function getClubMemberDiscount(
  userId: string,
  subtotal: number,
  supabaseClient?: SupabaseServerClient
): Promise<ClubMemberDiscountResult> {
  const isMember = await isClubMember(userId, supabaseClient)

  if (!isMember || subtotal <= 0) {
    return { isEligible: false, discountAmount: 0, discountPercentage: 0 }
  }

  const discountAmount = (subtotal * CLUB_DISCOUNT_PERCENTAGE) / 100

  return {
    isEligible: true,
    discountAmount,
    discountPercentage: CLUB_DISCOUNT_PERCENTAGE,
  }
}

/**
 * Marks a subscription for cancellation at the end of the current period.
 * The subscription remains active until current_period_end.
 * Uses admin client to bypass RLS since there's no UPDATE policy for users.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<SubscriptionResult<Subscription>> {
  try {
    // Use admin client to bypass RLS - no UPDATE policy exists for users
    const supabase = createAdminClient()

    const { data, error } = await (supabase.from('subscriptions') as any)
      .update({
        cancel_at_period_end: true,
      })
      .eq('id', subscriptionId)
      .select('*')
      .single()

    if (error) {
      console.error('Error canceling subscription:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error canceling subscription:', error)
    return { data: null, error: 'Unable to cancel subscription' }
  }
}

/**
 * Lists all subscriptions for a user (historical record).
 * Includes active, canceled, and past_due subscriptions.
 */
export async function getUserSubscriptions(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<SubscriptionResult<Subscription[]>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user subscriptions:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Unexpected error fetching user subscriptions:', error)
    return { data: null, error: 'Unable to fetch subscriptions' }
  }
}

/**
 * Updates subscription status.
 * Used by webhooks to update status after payment failures or reactivations.
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  cancelAtPeriodEnd?: boolean,
  canceledAt?: Date | null
): Promise<SubscriptionResult<Subscription>> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, any> = { status }

    if (cancelAtPeriodEnd !== undefined) {
      updateData.cancel_at_period_end = cancelAtPeriodEnd
    }

    if (canceledAt !== undefined) {
      updateData.canceled_at = canceledAt?.toISOString() ?? null
    }

    const { data, error } = await (supabase.from('subscriptions') as any)
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating subscription status:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error updating subscription status:', error)
    return { data: null, error: 'Unable to update subscription' }
  }
}
