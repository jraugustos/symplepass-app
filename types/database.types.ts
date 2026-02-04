/**
 * Database Types for Supabase
 * This file will be auto-generated using: supabase gen types typescript
 * For now, we define the schema manually
 */

export type UserRole = 'user' | 'admin' | 'organizer'
export type EventStatus = 'draft' | 'published' | 'published_no_registration' | 'cancelled' | 'completed' | 'pending_approval'
export type EventType = 'paid' | 'free' | 'solidarity'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export const EVENT_FORMATS = ['presencial', 'online', 'workshop', 'hibrido'] as const
export type EventFormat = typeof EVENT_FORMATS[number]
export type SportType =
  // Endurance / Outdoor
  | 'corrida'
  | 'caminhada'
  | 'trail_running'
  | 'ciclismo'
  | 'mountain_bike'
  | 'triatlo'
  | 'duatlo'
  | 'natacao'
  | 'aguas_abertas'
  // Beach Sports
  | 'beach_tenis'
  | 'futevolei'
  | 'volei_praia'
  | 'surf'
  | 'bodyboard'
  | 'kitesurf'
  | 'windsurf'
  | 'stand_up_paddle'
  | 'beach_run'
  // Fitness / Indoor
  | 'crossfit'
  | 'funcional'
  | 'calistenia'
  | 'academia'
  | 'spinning'
  | 'pilates'
  | 'yoga'
  // Coletivos
  | 'futebol'
  | 'futsal'
  | 'basquete'
  | 'volei'
  | 'handebol'
  | 'rugby'
  // Aventura / Natureza
  | 'canoagem'
  | 'remo'
  | 'corrida_montanha'
  | 'orientacao'
  | 'rapel'
  | 'parkour'
  // Urbanos
  | 'patins'
  | 'skate'
  | 'longboard'
  | 'bike_urbana'
  // Precisao
  | 'tiro_com_arco'
  | 'tiro_esportivo'
  // Outros
  | 'multiesportes'
  | 'obstaculos'
  | 'outro'
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type ShirtSize = string

// Photo order types
export type PhotoOrderStatus = 'pending' | 'confirmed' | 'cancelled'
export type PhotoPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// Subscription types
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | 'incomplete_expired' | 'paused'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface SubscriptionWithUser extends Subscription {
  user: User
}

export interface User {
  id: string
  email: string
  full_name: string
  cpf?: string | null // CPF is optional to allow quick signup without CPF
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  avatar_url: string | null
  role: UserRole
  favorite_sports?: string[] | null // Sports of interest for email segmentation
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  slug: string
  description: string
  banner_url: string | null
  location: any // JSONB field containing city, state, venue, address
  start_date: string
  end_date: string | null
  status: EventStatus
  sport_type: SportType
  event_format: EventFormat
  event_type: EventType
  solidarity_message: string | null
  allows_individual_registration: boolean
  allows_pair_registration: boolean
  allows_team_registration: boolean
  team_size: number | null
  shirt_sizes: string[]
  shirt_sizes_config?: any // JSONB field containing gender-based shirt sizes
  max_participants: number | null
  registration_start: string | null
  registration_end: string | null
  is_featured: boolean
  has_organizer: boolean
  show_course_info: boolean
  show_championship_format: boolean
  regulation_pdf_url: string | null
  regulation_updated_at: string | null
  kit_pickup_info: any // JSONB field
  allow_page_access: boolean // When false with published_no_registration status, buttons show "Em breve"
  created_at: string
  updated_at: string
  // Approval workflow fields
  service_fee: number
  approval_status: ApprovalStatus | null
  approval_notes: string | null
  approved_by: string | null
  approved_at: string | null
  // Computed fields from event_categories (available when querying from events_with_prices view)
  // These are REQUIRED (non-null) when queried from events_with_prices materialized view
  // COALESCE ensures they default to 0 for events with no categories
  min_price?: number
  max_price?: number
}

export interface EventCategory {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  max_participants: number | null
  current_participants: number
  display_order: number
  shirt_genders: ('masculino' | 'feminino' | 'infantil')[] | null
  created_at: string
  updated_at: string
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  category_id: string
  status: RegistrationStatus
  payment_status: PaymentStatus
  amount_paid: number | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  qr_code: string | null
  ticket_code: string | null
  shirt_size: ShirtSize | null
  partner_name: string | null
  is_partner_registration: boolean
  registration_data: Record<string, any> | null
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

// Helper types for queries with relations
export interface EventWithCategories extends Event {
  categories: EventCategory[]
}

export interface EventWithOrganizer extends Event {
  organizer: User
}

export interface RegistrationWithDetails extends Registration {
  event: Event
  category: EventCategory
  user: User
  // Raw Supabase relations when selecting with original table names
  events?: Event | null
  event_categories?: EventCategory | null
  profiles?: User | null
}

// New interfaces for event detail functionality
export interface EventKitItem {
  id: string
  event_id: string
  name: string
  description: string
  icon: string
  image_url: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface EventCourseInfo {
  id: string
  event_id: string
  map_image_url: string | null
  google_maps_url: string | null
  gpx_file_url: string | null
  start_finish_location: string | null
  elevation_gain: number | null
  elevation_loss: number | null
  max_elevation: number | null
  support_points: string[]
  course_notes: string | null
  specification_type: 'course' | 'championship_format'
  created_at: string
  updated_at: string
}

export interface EventFAQ {
  id: string
  event_id: string
  question: string
  answer: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface EventRegulation {
  id: string
  event_id: string
  title: string
  content: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface EventOrganizer {
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

// Composite interface for complete event detail
export interface EventDetailData extends Event {
  categories: EventCategory[]
  kit_items: EventKitItem[]
  course_info: EventCourseInfo | null
  faqs: EventFAQ[]
  regulations: EventRegulation[]
  organizer: EventOrganizer | null
}

// ============================================================
// ORGANIZER INVITE TOKENS
// ============================================================

export interface OrganizerInviteToken {
  id: string
  token: string
  email: string | null
  created_by: string
  used_by: string | null
  used_at: string | null
  expires_at: string
  revoked_at: string | null
  created_at: string
}

export interface OrganizerInviteTokenWithDetails extends OrganizerInviteToken {
  creator: User
  usedByUser: User | null
}

// ============================================================
// EVENT PHOTOS INTERFACES
// ============================================================

export interface EventPhoto {
  id: string
  event_id: string
  original_path: string
  watermarked_path: string
  thumbnail_path: string
  file_name: string
  file_size: number
  width: number | null
  height: number | null
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * @deprecated Use PhotoPricingTier instead. Kept for backward compatibility.
 */
export interface PhotoPackage {
  id: string
  event_id: string
  name: string
  quantity: number
  price: number
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Progressive pricing tier for photo purchases.
 * Replaces fixed packages with price-per-photo based on quantity.
 *
 * Example tiers:
 * - min_quantity: 1, price_per_photo: 10.00 (1-2 photos = R$10/each)
 * - min_quantity: 3, price_per_photo: 7.00 (3-9 photos = R$7/each)
 * - min_quantity: 10, price_per_photo: 5.00 (10+ photos = R$5/each)
 */
export interface PhotoPricingTier {
  id: string
  event_id: string
  min_quantity: number
  price_per_photo: number
  display_order: number
  created_at: string
  updated_at: string
}

export interface PhotoOrder {
  id: string
  event_id: string
  user_id: string
  status: PhotoOrderStatus
  payment_status: PhotoPaymentStatus
  total_amount: number
  /** @deprecated Use applied_tier_id instead */
  package_id: string | null
  /** Reference to the pricing tier applied at checkout */
  applied_tier_id: string | null
  /** Price per photo at checkout time (for audit) */
  price_per_photo_applied: number | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  created_at: string
  updated_at: string
}

export interface PhotoOrderItem {
  id: string
  order_id: string
  photo_id: string
  created_at: string
}

// Helper types for photo queries with relations
export interface PhotoOrderWithDetails extends PhotoOrder {
  event: Event
  user: User
  /** @deprecated Use appliedTier instead */
  package: PhotoPackage | null
  /** The pricing tier that was applied to this order */
  appliedTier: PhotoPricingTier | null
  items: PhotoOrderItemWithPhoto[]
}

export interface PhotoOrderItemWithPhoto extends PhotoOrderItem {
  photo: EventPhoto
}

export interface EventWithPhotos extends Event {
  photos: EventPhoto[]
  /** @deprecated Use pricing_tiers instead */
  photo_packages: PhotoPackage[]
  /** Progressive pricing tiers for this event */
  pricing_tiers: PhotoPricingTier[]
}

// Face recognition types
export type FaceProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'no_faces'

export interface PhotoFaceEmbedding {
  id: string
  photo_id: string
  event_id: string
  /** Face embedding vector (128 dimensions) - stored as string in format [n1,n2,...] */
  embedding: string
  /** Bounding box of the face in pixels */
  bounding_box: {
    x: number
    y: number
    width: number
    height: number
  } | null
  /** Detection confidence score (0-1) */
  detection_confidence: number | null
  created_at: string
}

export interface PhotoFaceProcessing {
  photo_id: string
  status: FaceProcessingStatus
  faces_found: number
  processed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>
      }
      event_categories: {
        Row: EventCategory
        Insert: Omit<EventCategory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventCategory, 'id' | 'created_at' | 'updated_at'>>
      }
      event_kit_items: {
        Row: EventKitItem
        Insert: Omit<EventKitItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventKitItem, 'id' | 'created_at' | 'updated_at'>>
      }
      event_course_info: {
        Row: EventCourseInfo
        Insert: Omit<EventCourseInfo, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventCourseInfo, 'id' | 'created_at' | 'updated_at'>>
      }
      event_faqs: {
        Row: EventFAQ
        Insert: Omit<EventFAQ, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventFAQ, 'id' | 'created_at' | 'updated_at'>>
      }
      event_regulations: {
        Row: EventRegulation
        Insert: Omit<EventRegulation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventRegulation, 'id' | 'created_at' | 'updated_at'>>
      }
      event_organizers: {
        Row: EventOrganizer
        Insert: Omit<EventOrganizer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventOrganizer, 'id' | 'created_at' | 'updated_at'>>
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Registration, 'id' | 'created_at' | 'updated_at'>>
      }
      event_photos: {
        Row: EventPhoto
        Insert: Omit<EventPhoto, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventPhoto, 'id' | 'created_at' | 'updated_at'>>
      }
      photo_packages: {
        Row: PhotoPackage
        Insert: Omit<PhotoPackage, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PhotoPackage, 'id' | 'created_at' | 'updated_at'>>
      }
      photo_pricing_tiers: {
        Row: PhotoPricingTier
        Insert: Omit<PhotoPricingTier, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PhotoPricingTier, 'id' | 'created_at' | 'updated_at'>>
      }
      photo_orders: {
        Row: PhotoOrder
        Insert: Omit<PhotoOrder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PhotoOrder, 'id' | 'created_at' | 'updated_at'>>
      }
      photo_order_items: {
        Row: PhotoOrderItem
        Insert: Omit<PhotoOrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<PhotoOrderItem, 'id' | 'created_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>
      }
      organizer_invite_tokens: {
        Row: OrganizerInviteToken
        Insert: Omit<OrganizerInviteToken, 'id' | 'created_at'>
        Update: Partial<Omit<OrganizerInviteToken, 'id' | 'created_at'>>
      }
      photo_face_embeddings: {
        Row: PhotoFaceEmbedding
        Insert: Omit<PhotoFaceEmbedding, 'id' | 'created_at'>
        Update: Partial<Omit<PhotoFaceEmbedding, 'id' | 'created_at'>>
      }
      photo_face_processing: {
        Row: PhotoFaceProcessing
        Insert: Omit<PhotoFaceProcessing, 'created_at' | 'updated_at'>
        Update: Partial<Omit<PhotoFaceProcessing, 'created_at' | 'updated_at'>>
      }
    }
  }
}
