/**
 * Central exports for all types used in the application
 */

// Re-export database types
export * from './database.types'

// Explicit imports for types used in this file
import type {
  Event,
  EventCategory,
  RegistrationWithDetails,
  User,
  SportType,
  EventStatus,
  EventType,
  EventFormat,
  RegistrationStatus,
  PaymentStatus,
  UserRole,
  ShirtSize,
  Subscription,
  SubscriptionWithUser,
  SubscriptionStatus,
} from './database.types'

// Re-export subscription types explicitly for convenience
export type {
  Subscription,
  SubscriptionWithUser,
  SubscriptionStatus,
}

// ===== UI Component Types =====

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral'

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'

// ===== Business Domain Types =====

export type ThemeOption = 'light' | 'dark' | 'system'

export type TabId =
  | 'visao-geral'
  | 'eventos'
  | 'fotos'
  | 'dados'
  | 'preferencias'
  | 'pagamentos'
  | 'config'

export interface NotificationSettings {
  eventUpdates: boolean
  promotionalEmails: boolean
}

export interface UserPreferences {
  id: string
  user_id: string
  favorite_sports: SportType[]
  notification_events: boolean
  notification_promotions: boolean
  theme: ThemeOption
  language: string
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  device_name: string | null
  ip_address: string | null
  user_agent: string | null
  last_active: string
  created_at: string
}

export interface PaymentHistoryItem {
  id: string
  registration_id: string
  event_title: string
  category_name: string | null
  amount: number
  payment_status: PaymentStatus
  payment_date: string
  stripe_payment_intent_id: string | null
}

export interface UserPanelStats {
  totalRegistrations: number
  upcomingEvents: number
  pendingPayments: number
  totalPaidEvents: number
}

export interface UserPanelData {
  profile: Profile
  registrations: RegistrationWithDetails[]
  photoOrders: import('@/lib/data/photo-orders').PhotoOrderWithDetails[]
  paymentHistory: PaymentHistoryItem[]
  preferences: UserPreferences
  sessions: UserSession[]
  stats: UserPanelStats
  subscription: Subscription | null
}

export interface ClubMembershipData {
  isActive: boolean
  subscription: Subscription | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

// ===== Shirt Size Types =====

export type ShirtGender = 'masculino' | 'feminino' | 'infantil'

export interface ShirtSizesByGender {
  masculino: string[]
  feminino: string[]
  infantil: string[]
}

// ===== Review & Checkout Types =====

export interface ParticipantData {
  name: string
  email: string
  cpf: string
  phone: string
  shirtSize: ShirtSize
  shirtGender?: ShirtGender
}

export type PartnerData = ParticipantData

export interface ReviewPageUser {
  id: string
  email?: string | null
  full_name?: string | null
  cpf?: string | null
  phone?: string | null
  gender?: string | null
  shirt_gender?: ShirtGender | null
  shirt_size?: ShirtSize | null
}

export interface ReviewPageData {
  event: Event
  category: EventCategory
  shirtSize: ShirtSize
  shirtGender?: ShirtGender | null
  partnerName?: string
  partnerShirtSize?: ShirtSize | null
  partnerShirtGender?: ShirtGender | null
  partnerData?: PartnerData
  teamMembers?: ParticipantData[]
  user?: ReviewPageUser
  isAuthenticated: boolean
}

export interface CheckoutSessionRequest {
  eventId: string
  categoryId: string
  shirtSize: ShirtSize
  shirtGender?: ShirtGender | null
  userName: string
  userEmail: string
  userData: ParticipantData
  partnerName?: string | null
  partnerData?: PartnerData | null
  teamMembers?: ParticipantData[] | null
  subtotal: number
  clubDiscount?: number
  couponCode?: string | null
  serviceFee: number
  total: number
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
  registrationId: string
}

export interface PriceBreakdown {
  subtotal: number
  clubDiscount?: number
  couponDiscount?: number
  serviceFee: number
  total: number
}

export interface ConfirmationPageData {
  registration: RegistrationWithDetails
  ticketCode: string
  qrCodeDataUrl: string | null
  amountPaid: number
  eventDateDisplay: string
  eventDateShort: string
  eventLocation: string
  eventStart: string
  eventEnd: string
}

export interface EmailConfirmationData {
  userEmail: string
  userName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  categoryName: string
  qrCodeDataUrl: string
  ticketCode: string
  registrationId: string
  qrMissingNote?: string | null
  partnerName?: string
  partnerData?: PartnerData
  eventType?: EventType
  solidarityMessage?: string
}

export interface EmailPhotoOrderConfirmationData {
  userEmail: string
  userName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  orderId: string
  packageName: string | null
  photoCount: number
  totalAmount: number
  downloadUrl: string
  photos: Array<{
    id: string
    file_name: string
    thumbnailUrl: string
  }>
}

export interface ICSEventData {
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
}

// ===== Event Detail Types =====

export interface CategorySelectionData {
  category_id: string
  category_name: string
  price: number
  shirt_size: ShirtSize
}

export interface KitPickupInfo {
  dates: string
  hours: string
  location: string
  notes: string
  google_maps_url?: string
}

export interface CourseElevation {
  gain: number | null
  loss: number | null
  max: number | null
}

// ===== Form Data Types =====

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface ResetPasswordFormData {
  email: string
}

export interface UpdatePasswordFormData {
  newPassword: string
  confirmNewPassword: string
}

export interface CompleteProfileFormData {
  full_name: string
  phone: string
  favorite_sports: string[]
}

export interface EventFormData {
  title: string
  description: string
  banner_url: string
  location: string
  city: string
  state: string
  start_date: string
  end_date: string
  sport_type: SportType
  status: EventStatus
}

export interface EventCategoryFormData {
  name: string
  description: string
  price: number
  max_participants: number
}

export interface RegistrationFormData {
  event_id: string
  category_id: string
  user_id: string
}

// ===== Auth Types =====

export interface AuthError {
  code: string
  message: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
}

export interface Profile {
  id: string
  email: string
  full_name: string
  cpf?: string | null
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  role: UserRole
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export type OAuthProvider = 'google' | 'github' | 'apple'

// ===== API Response Types =====

export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

// ===== Utility Types =====

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type ID = string

export type Timestamp = string

export type Currency = number

// ===== Filter & Search Types =====

export interface EventFilters {
  sport_type?: SportType
  city?: string
  state?: string
  start_date?: string
  end_date?: string
  status?: EventStatus
}

export type SortOption = 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'title_asc'

export interface EventsListFilters extends EventFilters {
  search?: string
  min_price?: number
  max_price?: number
  sort?: SortOption
  page?: number
}

export interface PaginatedEventsResponse {
  events: Event[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SearchParams {
  query?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ===== Molecule Component Types =====

export type NavigationVariant = 'dark' | 'light' | 'gradient' | 'transparent'

export type SearchBarVariant = 'hero' | 'events' | 'simple' | 'filters'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface UserMenuData {
  name: string
  email: string
  avatar?: string
}

// ===== Card Component Types =====

export type EventCardVariant = 'grid' | 'list' | 'compact'

export type InfoCardVariant = 'default' | 'gradient' | 'bordered' | 'compact' | 'stat' | 'list'

export interface TrendData {
  value: number
  isPositive: boolean
}

// ===== Layout Component Types =====

export type FooterVariant = 'dark' | 'light'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface SocialLink {
  icon: string
  href: string
  label: string
}

// ===== Home Page Types =====

export interface EventStats {
  totalEvents: number
  totalParticipants: number
  totalCities: number
}

export interface HomePageData {
  featuredEvents: Event[]
  upcomingEvents: Event[]
  eventStats: EventStats
}

// ===== Admin Event Management Types =====

export interface AdminEventFilters {
  status?: EventStatus
  sport_type?: SportType
  search?: string
  organizer_id?: string
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}

export interface AdminEventsListResponse {
  events: Event[]
  total: number
  page: number
  pageSize: number
}

export interface EventFormDataAdmin {
  title: string
  description: string
  banner_url?: string | null
  location: {
    city: string
    state: string
    venue?: string
    address?: string
    google_maps_url?: string
  }
  start_date: string
  end_date?: string | null
  sport_type: SportType
  event_format: EventFormat
  status: EventStatus
  event_type: EventType
  solidarity_message?: string | null
  allows_individual_registration: boolean
  allows_pair_registration: boolean
  allows_team_registration: boolean
  team_size?: number | null
  shirt_sizes: string[]
  shirt_sizes_config?: ShirtSizesByGender | null
  max_participants?: number | null
  registration_start?: string | null
  registration_end?: string | null
  is_featured: boolean
  has_organizer: boolean
  show_course_info: boolean
  show_championship_format: boolean
  allow_page_access: boolean
}

export interface CategoryFormData {
  name: string
  description?: string | null
  price: number
  max_participants?: number | null
  shirt_genders?: ('masculino' | 'feminino' | 'infantil')[] | null
}

export interface RegistrationFilters {
  payment_status?: PaymentStatus
  status?: RegistrationStatus
  category_id?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface RegistrationExportData {
  codigo_inscricao: string
  nome: string
  email: string
  cpf: string
  telefone: string
  categoria: string
  status_pagamento: string
  status_inscricao: string
  valor: string
  data_inscricao: string
  tamanho_camisa: string
  genero_camisa: string
  nome_parceiro: string
  email_parceiro: string
  cpf_parceiro: string
  telefone_parceiro: string
  tamanho_camisa_parceiro: string
  genero_camisa_parceiro: string
}

export interface EventStatsData {
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  cancelledRegistrations: number
  totalRevenue: number
  confirmedRevenue: number
  categoriesStats: Array<{
    category_id: string
    category_name: string
    registrations: number
    available_spots: number | null
  }>
}

// ===== Admin User Management Types =====

export interface UserFilters {
  role?: UserRole
  search?: string
  registration_status?: 'active' | 'inactive'
  page?: number
  pageSize?: number
}

export interface UserStats {
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  totalSpent: number
  averageSpent: number
}

export interface UserWithStats extends Profile {
  stats?: UserStats
}

export interface UserDetailData {
  user: Profile
  registrations: RegistrationWithDetails[]
  paymentHistory: PaymentHistoryItem[]
  stats: UserStats
}

// ===== Admin Financial Reports Types =====

export interface FinancialOverview {
  totalRevenue: number
  confirmedRevenue: number
  pendingRevenue: number
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  averageTicketPrice: number
  conversionRate: number
}

export interface SalesTrendData {
  date: string
  revenue: number
  registrations: number
}

export interface EventPerformanceData {
  eventId: string
  eventTitle: string
  totalRevenue: number
  totalRegistrations: number
  confirmedRegistrations: number
  conversionRate: number
}

export interface PaymentStatusBreakdown {
  status: string
  count: number
  revenue: number
  percentage: number
}

export interface ReportFilters {
  start_date?: string
  end_date?: string
  event_id?: string
  sport_type?: string
  payment_status?: PaymentStatus
}

export interface FinancialReportExport {
  event: string
  category: string
  participant: string
  email: string
  cpf: string
  registrationDate: string
  paymentStatus: string
  amount: string
  paymentMethod: string
  transactionId: string
}

// ===== Admin Coupon Management Types =====

export interface CouponFilters {
  status?: 'active' | 'expired' | 'disabled'
  event_id?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface CouponFormData {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  event_id?: string | null
  valid_from: string
  valid_until: string
  max_uses?: number | null
  status: 'active' | 'expired' | 'disabled'
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  event_id: string | null
  valid_from: string
  valid_until: string
  max_uses: number | null
  current_uses: number
  status: 'active' | 'expired' | 'disabled'
  created_by: string
  created_at: string
  updated_at: string
}

export interface CouponWithDetails extends Coupon {
  events?: {
    id: string
    title: string
  } | null
  profiles?: {
    id: string
    full_name: string
  }
}

export interface CouponUsage {
  id: string
  coupon_id: string
  user_id: string
  registration_id: string
  discount_applied: number
  used_at: string
}

export interface CouponUsageWithDetails extends CouponUsage {
  profiles?: {
    full_name: string
    email: string
  }
  event_registrations?: {
    events?: {
      title: string
    }
    event_categories?: {
      name: string
    }
  }
}

export interface CouponStats {
  totalUses: number
  maxUses: number | null
  totalDiscount: number
  averageDiscount: number
  usageRate: number
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discountAmount?: number
  error?: string
}

// ===== Event Details Form Types =====

export interface KitItemFormData {
  name: string
  description: string
  icon: string
  image_url?: string | null
}

export interface CourseInfoFormData {
  map_image_url?: string | null
  google_maps_url?: string | null
  gpx_file_url?: string | null
  start_finish_location?: string | null
  elevation_gain?: number | null
  elevation_loss?: number | null
  max_elevation?: number | null
  support_points?: string[]
  course_notes?: string | null
  specification_type?: 'course' | 'championship_format'
}

export interface FAQFormData {
  question: string
  answer: string | null
}

export interface RegulationFormData {
  title: string
  content: string
}

export interface OrganizerFormData {
  company_name: string
  cnpj?: string | null
  description?: string | null
  logo_url?: string | null
  website?: string | null
  contact_email?: string | null
}

export interface OrganizerProfileData {
  id: string
  profile_id: string
  company_name: string
  cnpj: string | null
  description: string | null
  logo_url: string | null
  website: string | null
  contact_email: string | null
  created_at: string
  updated_at: string
}

// ===== Photo Management Types =====

/**
 * @deprecated Use PhotoPricingTierFormData instead
 */
export interface PhotoPackageFormData {
  name: string
  quantity: number
  price: number
}

/**
 * Form data for creating/editing a pricing tier
 */
export interface PhotoPricingTierFormData {
  min_quantity: number
  price_per_photo: number
}

/**
 * Result from the progressive pricing calculation
 */
export interface PricingCalculationResult {
  /** The pricing tier that was applied */
  tier: import('./database.types').PhotoPricingTier | null
  /** Price per photo from the applied tier */
  pricePerPhoto: number
  /** Total price (quantity × pricePerPhoto) */
  totalPrice: number
  /** Number of photos in the calculation */
  quantity: number
}

/**
 * Formatted tier for display in UI
 */
export interface FormattedPricingTier {
  /** Display label like "1-2 fotos" or "10+ fotos" */
  label: string
  /** Price per photo in this tier */
  pricePerPhoto: number
  /** Minimum quantity to activate tier */
  minQty: number
  /** Maximum quantity for this tier (null if no upper limit) */
  maxQty: number | null
  /** Original tier ID */
  id: string
}

export interface CreatePhotoFormData {
  original_path: string
  watermarked_path: string
  thumbnail_path: string
  file_name: string
  file_size: number
  width: number | null
  height: number | null
}

// ===== Photo Checkout Types =====

export interface PhotoCheckoutRequest {
  eventId: string
  photoIds: string[]
  totalAmount: number
  packageId?: string | null
}

export interface PhotoCheckoutResponse {
  sessionId: string
  url: string
  orderId: string
}

export interface PhotoCheckoutPageData {
  event: {
    id: string
    title: string
    slug: string
    banner_url: string | null
    start_date: string
    location: {
      city: string
      state: string
    }
  }
  selectedPhotos: Array<{
    id: string
    file_name: string
    thumbnail_path: string
    thumbnailUrl: string
  }>
  packages: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  bestPackage: {
    id: string
    name: string
    quantity: number
    price: number
  } | null
  totalPrice: number
  user: {
    id: string
    email: string
    full_name: string | null
  }
}

// ===== Photo Download Types =====

export interface PhotoDownloadPageData {
  order: {
    id: string
    total_amount: number
    payment_status: string
    created_at: string
    package?: {
      id: string
      name: string
      quantity: number
      price: number
    } | null
  }
  event: {
    id: string
    title: string
    slug: string
    start_date: string
    location: { city: string; state: string } | null
  }
  photos: Array<{
    id: string
    file_name: string
    original_path: string
    thumbnail_path: string
    thumbnailUrl: string
  }>
  user: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface PhotoDownloadRequest {
  orderId: string
  photoId?: string
  photoIds?: string
}

export interface PhotoDownloadResponse {
  url?: string
  fileName?: string
  photos?: Array<{
    id: string
    url: string
    fileName: string
  }>
}

// ===== Mural de Fotos Types =====

export interface EventWithPhotoCount extends Event {
  photo_count: number
  preview_thumbnails?: string[]
}

export interface PaginatedEventsWithPhotosResponse {
  events: EventWithPhotoCount[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface MuralFotosStats {
  totalEvents: number
  totalPhotos: number
}
