import { createClient } from './server'
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  AuditSession,
  AuditSessionInsert,
  AuditSessionUpdate,
  Proposal,
  ProposalInsert,
  ProposalUpdate,
  Task,
  TaskInsert,
  TaskUpdate,
  ClientStage,
} from '@/types/database'

// Clients
export async function getClients(filters?: {
  stage?: ClientStage
  assigned_to?: string
  search?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('*, assigned_user:users!assigned_to(id, name, email)')
    .order('updated_at', { ascending: false })

  if (filters?.stage) {
    query = query.eq('stage', filters.stage)
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }
  if (filters?.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  return query
}

export async function getClient(id: string) {
  const supabase = await createClient()
  return supabase
    .from('clients')
    .select('*, assigned_user:users!assigned_to(id, name, email)')
    .eq('id', id)
    .single()
}

export async function createClientRecord(data: ClientInsert) {
  const supabase = await createClient()
  return supabase.from('clients').insert(data).select().single()
}

export async function updateClient(id: string, data: ClientUpdate) {
  const supabase = await createClient()
  return supabase.from('clients').update(data).eq('id', id).select().single()
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  return supabase.from('clients').delete().eq('id', id)
}

// Audit Sessions
export async function getAuditSessions(clientId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('audit_sessions')
    .select('*, client:clients(id, company_name), creator:users!created_by(id, name)')
    .order('updated_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  return query
}

export async function getAuditSession(id: string) {
  const supabase = await createClient()
  return supabase
    .from('audit_sessions')
    .select('*, client:clients(id, company_name), creator:users!created_by(id, name), processes(*)')
    .eq('id', id)
    .single()
}

export async function createAuditSession(data: AuditSessionInsert) {
  const supabase = await createClient()
  return supabase.from('audit_sessions').insert(data).select().single()
}

export async function updateAuditSession(id: string, data: AuditSessionUpdate) {
  const supabase = await createClient()
  return supabase.from('audit_sessions').update(data).eq('id', id).select().single()
}

// Proposals
export async function getProposals(clientId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('proposals')
    .select('*, client:clients(id, company_name), creator:users!created_by(id, name)')
    .order('updated_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  return query
}

export async function getProposal(id: string) {
  const supabase = await createClient()
  return supabase
    .from('proposals')
    .select('*, client:clients(id, company_name), creator:users!created_by(id, name), session:audit_sessions(id, title)')
    .eq('id', id)
    .single()
}

export async function createProposal(data: ProposalInsert) {
  const supabase = await createClient()
  return supabase.from('proposals').insert(data).select().single()
}

export async function updateProposal(id: string, data: ProposalUpdate) {
  const supabase = await createClient()
  return supabase.from('proposals').update(data).eq('id', id).select().single()
}

// Tasks
export async function getTasks(filters?: {
  assigned_to?: string
  status?: 'pending' | 'completed'
  client_id?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('tasks')
    .select('*, client:clients(id, company_name), assignee:users!assigned_to(id, name)')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  return query
}

export async function createTask(data: TaskInsert) {
  const supabase = await createClient()
  return supabase.from('tasks').insert(data).select().single()
}

export async function updateTask(id: string, data: TaskUpdate) {
  const supabase = await createClient()
  return supabase.from('tasks').update(data).eq('id', id).select().single()
}

export async function completeTask(id: string) {
  const supabase = await createClient()
  return supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// Activity Log
export async function logActivity(data: {
  client_id: string
  user_id: string
  action: 'created' | 'updated' | 'stage_changed' | 'proposal_sent' | 'note_added' | 'task_completed'
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  return supabase.from('activity_log').insert(data)
}

export async function getClientActivity(clientId: string, limit = 20) {
  const supabase = await createClient()
  return supabase
    .from('activity_log')
    .select('*, user:users(id, name)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

// Pipeline / Stage counts
export async function getPipelineCounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('stage')

  if (error) throw error

  const counts: Record<string, number> = {}
  data?.forEach((client) => {
    counts[client.stage] = (counts[client.stage] || 0) + 1
  })

  return counts
}

// Users
export async function getUsers() {
  const supabase = await createClient()
  return supabase.from('users').select('*').order('name')
}
