'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { signOut as serverSignOut } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data as Profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [supabase, fetchProfile])

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setUser(null)
          setProfile(null)
        }

        setIsLoading(false)

        // Refresh router on auth changes
        router.refresh()
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, router])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      await serverSignOut()
      setUser(null)
      setProfile(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const value = {
    user,
    profile,
    isLoading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * Hook to require authentication (redirects if not authenticated)
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, redirectTo, router])

  return { user, isLoading }
}

/**
 * Hook to require specific role (redirects if not authorized)
 */
export function useRequireRole(
  allowedRoles: Array<'user' | 'organizer' | 'admin'>,
  redirectTo: string = '/conta'
) {
  const { profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && profile && !allowedRoles.includes(profile.role)) {
      router.push(redirectTo)
    }
  }, [profile, isLoading, allowedRoles, redirectTo, router])

  return { profile, isLoading }
}
