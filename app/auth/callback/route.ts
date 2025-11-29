import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirectAfterLogin } from '@/lib/auth/utils'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
      }

      if (data.user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If profile doesn't exist, create it (this should be handled by trigger, but as a fallback)
        if (profileError && profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url,
            role: 'user',
          })

          if (insertError) {
            console.error('Error creating profile:', insertError)
          }
        }

        // Get fresh profile data to determine redirect
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Redirect based on role
        const role = freshProfile?.role || 'user'
        const destination = redirectAfterLogin(role)

        return NextResponse.redirect(`${origin}${destination}`)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
