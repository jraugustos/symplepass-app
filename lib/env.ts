/**
 * Environment Variable Validation and Configuration
 * Centralized access to required environment variables with validation
 */

interface EnvironmentConfig {
  // Supabase
  supabase: {
    url: string
    anonKey: string
  }
  // Stripe
  stripe: {
    secretKey: string
    publicKey: string
  }
  // Application base configuration
  app: {
    baseUrl: string
  }
  // Node environment
  nodeEnv: string
}

/**
 * Validates and retrieves required environment variables
 * Throws errors in production if critical variables are missing
 * Logs warnings in development
 */
function validateEnv(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isDevelopment = nodeEnv === 'development'

  // Supabase environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const message =
      'Missing required Supabase environment variables:\n' +
      (!supabaseUrl ? '  - NEXT_PUBLIC_SUPABASE_URL\n' : '') +
      (!supabaseAnonKey ? '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' : '') +
      'Please configure these in your .env.local file.'

    if (isDevelopment) {
      console.warn('⚠️  WARNING:', message)
    } else {
      throw new Error(message)
    }
  }

  // Stripe environment variables
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!stripeSecretKey || !stripePublicKey) {
    const message =
      'Missing required Stripe environment variables:\n' +
      (!stripeSecretKey ? '  - STRIPE_SECRET_KEY\n' : '') +
      (!stripePublicKey ? '  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\n' : '') +
      'Please configure these in your .env.local file.'

    if (isDevelopment) {
      console.warn('⚠️  WARNING:', message)
    } else {
      throw new Error(message)
    }
  }

  // Application URL for redirects
  let appBaseUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appBaseUrl) {
    const message =
      'Missing application base URL environment variable:\n' +
      '  - NEXT_PUBLIC_APP_URL\n' +
      'This is required for building Stripe success and cancel URLs.'

    if (isDevelopment) {
      console.warn('⚠️  WARNING:', message, '\nUsing default: http://localhost:3000')
      appBaseUrl = 'http://localhost:3000'
    } else {
      throw new Error(message)
    }
  }

  return {
    supabase: {
      url: supabaseUrl || '',
      anonKey: supabaseAnonKey || '',
    },
    stripe: {
      secretKey: stripeSecretKey || '',
      publicKey: stripePublicKey || '',
    },
    app: {
      baseUrl: appBaseUrl,
    },
    nodeEnv,
  }
}

// Validate environment variables on module load (server-side only)
let env: EnvironmentConfig | null = null

if (typeof window === 'undefined') {
  env = validateEnv()
}

/**
 * Get validated environment configuration
 * Safe to use on both client and server
 */
export function getEnv(): EnvironmentConfig {
  // On server, return cached validated env
  if (typeof window === 'undefined') {
    if (!env) {
      env = validateEnv()
    }
    return env
  }

  // On client, read public variables directly
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    stripe: {
      secretKey: '', // Not available on client
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    },
    app: {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    nodeEnv: process.env.NODE_ENV || 'development',
  }
}

/**
 * Helper to check if environment is properly configured
 */
export function isEnvConfigured(): boolean {
  const config = getEnv()
  return !!(
    config.supabase.url &&
    config.supabase.anonKey &&
    (typeof window !== 'undefined' || config.stripe.secretKey) &&
    config.stripe.publicKey &&
    config.app.baseUrl
  )
}

export default getEnv
