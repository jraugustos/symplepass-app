/**
 * Database Types for Supabase
 * This file will be auto-generated using: supabase gen types typescript
 * For now, we define the schema manually
 */

export type UserRole = 'user' | 'admin' | 'organizer'
export type EventStatus = 'draft' | 'published' | 'published_no_registration' | 'cancelled' | 'completed'
export type EventType = 'paid' | 'free' | 'solidarity'
export const EVENT_FORMATS = ['presencial', 'online', 'workshop', 'hibrido'] as const
export type EventFormat = typeof EVENT_FORMATS[number]
export type SportType =
  | 'corrida'
  | 'ciclismo'
  | 'triatlo'
  | 'natacao'
  | 'caminhada'
  | 'crossfit'
  | 'beach_sports'
  | 'trail_running'
  | 'beach_tenis'
  | 'futevolei'
  | 'volei_praia'
  | 'stand_up_paddle'
  | 'outro'
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type ShirtSize = string

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
  allows_pair_registration: boolean
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
  created_at: string
  updated_at: string
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
  shirt_size: ShirtSize | null
  partner_name: string | null
  is_partner_registration: boolean
  registration_data: Record<string, any> | null
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
    }
  }
}
