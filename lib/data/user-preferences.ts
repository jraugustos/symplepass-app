import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { SportType, ThemeOption, UserPreferences, UserSession } from '@/types'

type Result<T> = {
  data: T | null
  error: string | null
}

type SupabaseServerClient = SupabaseClient<Database>

const VALID_THEMES: ThemeOption[] = ['light', 'dark', 'system']
const VALID_SPORTS: SportType[] = [
  'corrida',
  'ciclismo',
  'triatlo',
  'natacao',
  'caminhada',
  'crossfit',
  'beach_sports',
  'trail_running',
  'outro',
]

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  favorite_sports: [],
  notification_events: true,
  notification_promotions: true,
  theme: 'system',
  language: 'pt-BR',
}

function getClient(providedClient?: SupabaseServerClient) {
  return providedClient ?? createClient()
}

function detectDeviceName(userAgent?: string | null) {
  if (!userAgent) return 'Dispositivo atual'
  const ua = userAgent.toLowerCase()

  if (ua.includes('iphone')) return 'iPhone'
  if (ua.includes('ipad')) return 'iPad'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('mac')) return 'Mac'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('linux')) return 'Linux'

  return 'Dispositivo atual'
}

function sanitizeSports(sports?: SportType[] | null) {
  if (!sports || sports.length === 0) return []

  const validSet = new Set(VALID_SPORTS)
  return sports.filter((sport) => validSet.has(sport))
}

function sanitizeTheme(theme?: ThemeOption | null) {
  if (!theme) return DEFAULT_PREFERENCES.theme
  return VALID_THEMES.includes(theme) ? theme : DEFAULT_PREFERENCES.theme
}

export async function getUserPreferences(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<Result<UserPreferences>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user preferences:', error)
      return { data: null, error: error.message }
    }

    if (!data) {
      const created = await createDefaultPreferences(userId, supabase)
      return created
    }

    return { data: data as UserPreferences, error: null }
  } catch (error) {
    console.error('Unexpected error fetching user preferences:', error)
    return { data: null, error: 'Não foi possível carregar preferências' }
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
  supabaseClient?: SupabaseServerClient
): Promise<Result<UserPreferences>> {
  try {
    const supabase = getClient(supabaseClient)

    const payload: Partial<UserPreferences> = {}

    if (preferences.favorite_sports) {
      payload.favorite_sports = sanitizeSports(preferences.favorite_sports)
    }

    if (typeof preferences.notification_events === 'boolean') {
      payload.notification_events = preferences.notification_events
    }

    if (typeof preferences.notification_promotions === 'boolean') {
      payload.notification_promotions = preferences.notification_promotions
    }

    if (preferences.theme) {
      payload.theme = sanitizeTheme(preferences.theme)
    }

    if (preferences.language) {
      payload.language = preferences.language
    }

    if (Object.keys(payload).length === 0) {
      return { data: null, error: 'Nenhuma alteração informada' }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(payload)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return { data: null, error: error.message }
    }

    return { data: data as UserPreferences, error: null }
  } catch (error) {
    console.error('Unexpected error updating user preferences:', error)
    return { data: null, error: 'Não foi possível atualizar preferências' }
  }
}

export async function getUserSessions(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<Result<UserSession[]>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active', { ascending: false })

    if (error) {
      console.error('Error fetching user sessions:', error)
      return { data: null, error: error.message }
    }

    return { data: (data as UserSession[]) ?? [], error: null }
  } catch (error) {
    console.error('Unexpected error fetching user sessions:', error)
    return { data: null, error: 'Não foi possível carregar sessões' }
  }
}

export async function deleteUserSession(
  sessionId: string,
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<Result<{ success: boolean }>> {
  try {
    const supabase = getClient(supabaseClient)

    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting user session:', error)
      return { data: null, error: error.message }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Unexpected error deleting user session:', error)
    return { data: null, error: 'Não foi possível encerrar a sessão' }
  }
}

export async function recordUserSession(
  userId: string,
  sessionInfo: {
    ipAddress?: string | null
    userAgent?: string | null
    deviceName?: string | null
  },
  supabaseClient?: SupabaseServerClient
): Promise<Result<{ success: boolean }>> {
  try {
    const supabase = getClient(supabaseClient)
    const deviceName = sessionInfo.deviceName ?? detectDeviceName(sessionInfo.userAgent)

    const { error } = await supabase.from('user_sessions').insert({
      user_id: userId,
      device_name: deviceName,
      ip_address: sessionInfo.ipAddress ?? null,
      user_agent: sessionInfo.userAgent ?? null,
      last_active: new Date().toISOString(),
    })

    if (error) {
      console.error('Error recording user session:', error)
      return { data: null, error: error.message }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Unexpected error recording user session:', error)
    return { data: null, error: 'Não foi possível registrar a sessão' }
  }
}

export async function createDefaultPreferences(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<Result<UserPreferences>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        favorite_sports: DEFAULT_PREFERENCES.favorite_sports,
        notification_events: DEFAULT_PREFERENCES.notification_events,
        notification_promotions: DEFAULT_PREFERENCES.notification_promotions,
        theme: DEFAULT_PREFERENCES.theme,
        language: DEFAULT_PREFERENCES.language,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating default preferences:', error)
      return { data: null, error: error.message }
    }

    return { data: data as UserPreferences, error: null }
  } catch (error) {
    console.error('Unexpected error creating default preferences:', error)
    return { data: null, error: 'Não foi possível criar preferências' }
  }
}
