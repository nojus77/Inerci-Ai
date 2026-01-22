import type { UserRole } from '@/types/database'

// Permission definitions based on PRD
export const PERMISSIONS: Record<string, UserRole[]> = {
  // Settings & Users
  manage_users: ['admin'],
  manage_settings: ['admin'],

  // CRM - Clients
  view_clients: ['admin', 'sales', 'marketing'],
  create_clients: ['admin', 'sales'],
  edit_clients: ['admin', 'sales'],
  delete_clients: ['admin'],

  // Audit Sessions
  view_sessions: ['admin', 'sales', 'marketing'],
  create_sessions: ['admin', 'sales'],
  edit_sessions: ['admin', 'sales'],

  // Proposals
  view_proposals: ['admin', 'sales', 'marketing'],
  create_proposals: ['admin', 'sales'],
  edit_proposals: ['admin', 'sales'],

  // Tasks
  view_tasks: ['admin', 'sales', 'marketing'],
  create_tasks: ['admin', 'sales'],
  edit_tasks: ['admin', 'sales'],

  // AI Operations
  run_ai: ['admin', 'sales'],
  view_ai_artifacts: ['admin', 'sales', 'marketing'],

  // Pipeline
  view_pipeline: ['admin', 'sales', 'marketing'],
  edit_pipeline: ['admin', 'sales'],
}

export type Permission =
  | 'manage_users'
  | 'manage_settings'
  | 'view_clients'
  | 'create_clients'
  | 'edit_clients'
  | 'delete_clients'
  | 'view_sessions'
  | 'create_sessions'
  | 'edit_sessions'
  | 'view_proposals'
  | 'create_proposals'
  | 'edit_proposals'
  | 'view_tasks'
  | 'create_tasks'
  | 'edit_tasks'
  | 'run_ai'
  | 'view_ai_artifacts'
  | 'view_pipeline'
  | 'edit_pipeline'

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(role)
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'manage_users')
}

export function canRunAI(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'run_ai')
}

export function canEditClients(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'edit_clients')
}

export function canCreateClients(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'create_clients')
}

export function canEditTasks(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'edit_tasks')
}
