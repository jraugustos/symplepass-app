import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Footer } from '@/components/layout/footer'
import { getEventDetailBySlug } from '@/lib/data/events'
import { createClient } from '@/lib/supabase/server'
import { calculateServiceFee, calculateTotal } from '@/lib/utils'
import type { ReviewPageData, PriceBreakdown as PriceBreakdownData, ShirtSize, ShirtGender } from '@/types'
import { ReviewClient } from './review-client'

export const metadata: Metadata = {
  title: 'Revise suas informações - Symplepass',
  description:
    'Confirme seus dados e finalize sua inscrição com pagamento seguro via Stripe na Symplepass.',
}

export const revalidate = 3600

const VALID_SHIRT_SIZES: ShirtSize[] = ['P', 'M', 'G', 'GG', 'XG']

interface ReviewPageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const eventSlug = typeof searchParams.event === 'string' ? searchParams.event : null
  const categoryId = typeof searchParams.category === 'string' ? searchParams.category : null
  const sizeParam = typeof searchParams.size === 'string' ? searchParams.size.toUpperCase() : null
  const genderParam = typeof searchParams.gender === 'string' ? searchParams.gender.toLowerCase() : null
  const partnerName = typeof searchParams.partner === 'string' ? searchParams.partner : null
  const partnerSizeParam = typeof searchParams.partner_size === 'string' ? searchParams.partner_size.toUpperCase() : null
  const partnerGenderParam = typeof searchParams.partner_gender === 'string'
    ? searchParams.partner_gender.toLowerCase()
    : null

  if (!eventSlug || !categoryId) {
    redirect('/eventos')
  }

  const eventData = await getEventDetailBySlug(eventSlug)

  if (!eventData) {
    redirect('/eventos')
  }

  const category = eventData.categories?.find((item) => item.id === categoryId)

  if (!category) {
    redirect('/eventos')
  }

  const shirtSize = (VALID_SHIRT_SIZES.includes(sizeParam as ShirtSize)
    ? (sizeParam as ShirtSize)
    : 'M') as ShirtSize

  const subtotal = category.price || 0
  const serviceFee = calculateServiceFee(subtotal)
  const total = calculateTotal(subtotal, serviceFee)
  const priceBreakdown: PriceBreakdownData = {
    subtotal,
    serviceFee,
    total,
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profileName: string | null = null
  let profileCpf: string | null = null
  let profilePhone: string | null = null
  let profileGender: string | null = null
  const partnerShirtSize = (VALID_SHIRT_SIZES.includes(partnerSizeParam as ShirtSize)
    ? (partnerSizeParam as ShirtSize)
    : null) as ShirtSize | null

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, cpf, phone, gender')
      .eq('id', user.id)
      .single()

    if (profileData?.full_name) {
      profileName = profileData.full_name
    } else if (user.user_metadata?.full_name) {
      profileName = user.user_metadata.full_name
    }

    profileCpf = profileData?.cpf ?? user.user_metadata?.cpf ?? null
    profilePhone = profileData?.phone ?? user.user_metadata?.phone ?? null
    profileGender = profileData?.gender ?? user.user_metadata?.gender ?? null
  }

  const normalizedProfileGender = (profileGender === 'masculino' || profileGender === 'feminino' || profileGender === 'infantil')
    ? (profileGender as ShirtGender)
    : null

  const userData = user
    ? {
      id: user.id,
      email: user.email ?? null,
      full_name: profileName,
      cpf: profileCpf,
      phone: profilePhone,
      gender: profileGender,
      shirt_gender: normalizedProfileGender,
    }
    : undefined

  const normalizedGender = (genderParam === 'masculino' || genderParam === 'feminino' || genderParam === 'infantil')
    ? (genderParam as ShirtGender)
    : normalizedProfileGender

  const normalizedPartnerGender = (partnerGenderParam === 'masculino' || partnerGenderParam === 'feminino' || partnerGenderParam === 'infantil')
    ? (partnerGenderParam as ShirtGender)
    : null

  const reviewData: ReviewPageData = {
    event: eventData,
    category,
    shirtSize,
    shirtGender: normalizedGender,
    partnerName: partnerName || undefined,
    partnerShirtSize,
    partnerShirtGender: normalizedPartnerGender,
    user: userData,
    isAuthenticated: Boolean(user),
  }

  return (
    <>
      <ReviewClient {...reviewData} priceBreakdown={priceBreakdown} />
      <Footer variant="light" />
    </>
  )
}
