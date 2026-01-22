'use client'

import { useEffect, useState } from 'react'
import { createClient } from './client'
import type { UserRole } from '@/types/database'
import type { Tables } from './types'
import type { User as AuthUser } from '@supabase/supabase-js'

type UserRow = Tables<'users'>

interface UseUserReturn {
  user: AuthUser | null
  profile: UserRow | null
  loading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) throw authError

        setUser(authUser)

        if (authUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError
          }

          setProfile(profileData as UserRow | null)
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load user'))
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profileData as UserRow | null)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, profile, loading, error }
}

export function useSignOut() {
  const supabase = createClient()

  return async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }
}

// Role-based permission checks
export function hasPermission(
  role: UserRole | undefined,
  action: 'manage_users' | 'manage_settings' | 'manage_clients' | 'view_clients' | 'run_ai'
): boolean {
  if (!role) return false

  const permissions: Record<string, UserRole[]> = {
    manage_users: ['admin'],
    manage_settings: ['admin'],
    manage_clients: ['admin', 'sales'],
    view_clients: ['admin', 'sales', 'marketing'],
    run_ai: ['admin', 'sales'],
  }

  return permissions[action]?.includes(role) ?? false
}
