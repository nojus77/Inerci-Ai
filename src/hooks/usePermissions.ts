'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'
import { hasPermission, Permission, PERMISSIONS } from '@/lib/permissions'

interface UsePermissionsReturn {
  role: UserRole | null
  loading: boolean
  can: (permission: Permission) => boolean
  isAdmin: boolean
  isSales: boolean
  isMarketing: boolean
  canManageUsers: boolean
  canRunAI: boolean
  canEditClients: boolean
  canCreateClients: boolean
  canEditTasks: boolean
  canEditPipeline: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role || 'sales') // Default to sales if no role set
      setLoading(false)
    }

    fetchRole()
  }, [supabase])

  const can = useCallback((permission: Permission) => {
    return hasPermission(role, permission)
  }, [role])

  return {
    role,
    loading,
    can,
    isAdmin: role === 'admin',
    isSales: role === 'sales',
    isMarketing: role === 'marketing',
    canManageUsers: hasPermission(role, 'manage_users'),
    canRunAI: hasPermission(role, 'run_ai'),
    canEditClients: hasPermission(role, 'edit_clients'),
    canCreateClients: hasPermission(role, 'create_clients'),
    canEditTasks: hasPermission(role, 'edit_tasks'),
    canEditPipeline: hasPermission(role, 'edit_pipeline'),
  }
}
