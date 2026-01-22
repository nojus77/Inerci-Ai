import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'
import { PERMISSIONS, Permission } from '@/lib/permissions'

export async function checkPermission(permission: Permission): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) return false

  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(profile.role)
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role || null
}

export async function requirePermission(permission: Permission): Promise<{ allowed: boolean; error?: Response }> {
  const hasPermission = await checkPermission(permission)

  if (!hasPermission) {
    return {
      allowed: false,
      error: new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  return { allowed: true }
}
