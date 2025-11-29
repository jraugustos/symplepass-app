import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const criticalEnvVars = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY },
  { key: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY },
]

const optionalEnvVars = [
  { key: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
]

const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.APP_VERSION ||
  process.env.npm_package_version ||
  '0.1.0'

export async function GET() {
  const timestamp = new Date().toISOString()
  const checks: {
    database: {
      status: 'ok' | 'failed'
      latency: number
      error?: string
    }
    environment: {
      status: 'ok' | 'degraded' | 'failed'
      missingCritical?: string[]
      missingOptional?: string[]
    }
  } = {
    database: {
      status: 'ok',
      latency: 0,
    },
    environment: {
      status: 'ok',
    },
  }

  const missingCritical = criticalEnvVars.filter((envVar) => !envVar.value).map((envVar) => envVar.key)
  const missingOptional = optionalEnvVars.filter((envVar) => !envVar.value).map((envVar) => envVar.key)

  if (missingCritical.length > 0) {
    checks.environment.status = 'failed'
    checks.environment.missingCritical = missingCritical
  }

  if (missingOptional.length > 0) {
    // If there are no critical failures, mark overall environment as degraded.
    if (checks.environment.status === 'ok') {
      checks.environment.status = 'degraded'
    }
    checks.environment.missingOptional = missingOptional
  }

  let databaseHealthy = true
  const queryStart = Date.now()

  try {
    const supabase = createClient()
    const { error } = await supabase.from('events').select('id', { head: true, count: 'exact' }).limit(1)

    checks.database.latency = Date.now() - queryStart

    if (error) {
      databaseHealthy = false
      checks.database.status = 'failed'
      checks.database.error = error.message
    }
  } catch (error) {
    checks.database.latency = Date.now() - queryStart
    databaseHealthy = false
    checks.database.status = 'failed'
    checks.database.error = error instanceof Error ? error.message : 'Unexpected Supabase error'
  }

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  let statusCode = 200

  if (checks.environment.status === 'failed' || !databaseHealthy) {
    status = 'unhealthy'
    statusCode = 503
  } else if (checks.environment.status === 'degraded' || checks.database.latency > 1000) {
    status = 'degraded'
  }

  const responsePayload = {
    status,
    timestamp,
    version: APP_VERSION,
    checks,
  }

  return NextResponse.json(responsePayload, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
