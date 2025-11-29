import { createAdminClient } from '@/lib/supabase/server'

type AuditAction =
  | 'role_change'
  | 'registration_delete'
  | 'export_registrations'
  | 'export_reports'
  | 'coupon_create'
  | 'coupon_update'
  | 'coupon_delete'

type TargetType = 'user' | 'registration' | 'report' | 'coupon' | 'other'

interface AuditLogOptions {
  action: AuditAction
  targetType: TargetType
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Creates an audit log entry for administrative actions.
 * This function uses fire-and-forget pattern - it logs errors but doesn't fail the main operation.
 *
 * @param options - Audit log options including action, target type, and optional metadata
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 *
 * @example
 * ```typescript
 * // Log a role change
 * await logAuditAction({
 *   action: 'role_change',
 *   targetType: 'user',
 *   targetId: userId,
 *   details: { newRole: 'admin', changedBy: adminId },
 *   ipAddress: getClientIP(request),
 *   userAgent: getUserAgent(request),
 * })
 * ```
 */
export async function logAuditAction(options: AuditLogOptions): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('create_audit_log', {
      p_action: options.action,
      p_target_type: options.targetType,
      p_target_id: options.targetId || null,
      p_details: options.details || {},
      p_ip_address: options.ipAddress || null,
      p_user_agent: options.userAgent || null,
    })

    if (error) {
      console.error('Audit log error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Audit log error:', error)
    return false
  }
}

/**
 * Extracts the client IP address from the request headers.
 * Checks x-forwarded-for header first (for proxied requests), then falls back to x-real-ip.
 *
 * @param request - The Next.js request object
 * @returns The client IP address or null if not found
 */
export function getClientIP(request: Request): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    null
  )
}

/**
 * Extracts the user agent string from the request headers.
 *
 * @param request - The Next.js request object
 * @returns The user agent string or null if not found
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent')
}
