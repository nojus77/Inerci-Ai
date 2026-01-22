export type UserRole = 'admin' | 'sales' | 'marketing'

export type ClientStage =
  | 'lead'
  | 'audit_scheduled'
  | 'audit_done'
  | 'prototype_building'
  | 'prototype_delivered'
  | 'proposal_draft'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'on_hold'

export type AuditStatus = 'draft' | 'in_progress' | 'complete' | 'archived'
export type AuditMode = 'live_capture' | 'refinement'
export type ProposalStatus = 'draft' | 'review_requested' | 'approved' | 'sent'
export type ProposalLanguage = 'en' | 'lt'
export type TaskStatus = 'pending' | 'completed'
export type AIProvider = 'openai' | 'claude'
export type AIArtifactType = 'summary' | 'analysis' | 'suggestions' | 'draft' | 'section'
export type ActivityAction = 'created' | 'updated' | 'stage_changed' | 'proposal_sent' | 'note_added' | 'task_completed'
export type EntityType = 'session' | 'proposal' | 'client'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface ReviewComment {
  id: string
  user_id: string
  user_name: string
  content: string
  section?: string
  resolved: boolean
  created_at: string
}

export interface ProcessData {
  id: string
  name: string
  description: string
  pain_points: string
  volume_metrics: string
  time_spent: string
  frequency: string
  owner: string
  automation_potential: number
  impact_score: number
  feasibility_score: number
  ai_assumptions: string[]
}

export interface PricingData {
  hours_estimate: number
  hourly_rate: number
  complexity_multiplier: number
  integration_cost: number
  total_override?: number
  notes?: string
}

// Relationship type for Supabase
type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: UserRole
          notification_prefs: Record<string, boolean>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: UserRole
          notification_prefs?: Record<string, boolean>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: UserRole
          notification_prefs?: Record<string, boolean>
          created_at?: string
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      clients: {
        Row: {
          id: string
          company_name: string
          contact_name: string
          email: string
          phone: string | null
          stage: ClientStage
          assigned_to: string | null
          notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          contact_name: string
          email: string
          phone?: string | null
          stage?: ClientStage
          assigned_to?: string | null
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          contact_name?: string
          email?: string
          phone?: string | null
          stage?: ClientStage
          assigned_to?: string | null
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      audit_sessions: {
        Row: {
          id: string
          client_id: string
          title: string
          status: AuditStatus
          mode: AuditMode
          chat_messages: ChatMessage[]
          structured_data: Record<string, unknown>
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          status?: AuditStatus
          mode?: AuditMode
          chat_messages?: ChatMessage[]
          structured_data?: Record<string, unknown>
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          status?: AuditStatus
          mode?: AuditMode
          chat_messages?: ChatMessage[]
          structured_data?: Record<string, unknown>
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      processes: {
        Row: {
          id: string
          session_id: string
          name: string
          description: string
          pain_points: string | null
          volume_metrics: string | null
          time_spent: string | null
          frequency: string | null
          owner: string | null
          automation_potential: number
          impact_score: number
          feasibility_score: number
          ai_assumptions: string[]
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          description: string
          pain_points?: string | null
          volume_metrics?: string | null
          time_spent?: string | null
          frequency?: string | null
          owner?: string | null
          automation_potential?: number
          impact_score?: number
          feasibility_score?: number
          ai_assumptions?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          description?: string
          pain_points?: string | null
          volume_metrics?: string | null
          time_spent?: string | null
          frequency?: string | null
          owner?: string | null
          automation_potential?: number
          impact_score?: number
          feasibility_score?: number
          ai_assumptions?: string[]
          created_at?: string
        }
        Relationships: Relationship[]
      }
      proposals: {
        Row: {
          id: string
          client_id: string
          session_id: string | null
          title: string
          language: ProposalLanguage
          content: Record<string, unknown>
          enabled_sections: string[]
          pricing_data: PricingData
          status: ProposalStatus
          review_comments: ReviewComment[]
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          session_id?: string | null
          title: string
          language?: ProposalLanguage
          content?: Record<string, unknown>
          enabled_sections?: string[]
          pricing_data?: PricingData
          status?: ProposalStatus
          review_comments?: ReviewComment[]
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          session_id?: string | null
          title?: string
          language?: ProposalLanguage
          content?: Record<string, unknown>
          enabled_sections?: string[]
          pricing_data?: PricingData
          status?: ProposalStatus
          review_comments?: ReviewComment[]
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      proposal_snapshots: {
        Row: {
          id: string
          proposal_id: string
          name: string
          content: Record<string, unknown>
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          name: string
          content: Record<string, unknown>
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          name?: string
          content?: Record<string, unknown>
          created_by?: string
          created_at?: string
        }
        Relationships: Relationship[]
      }
      ai_artifacts: {
        Row: {
          id: string
          session_id: string
          type: AIArtifactType
          content: string
          provider: AIProvider
          model_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          type: AIArtifactType
          content: string
          provider: AIProvider
          model_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          type?: AIArtifactType
          content?: string
          provider?: AIProvider
          model_id?: string
          created_at?: string
        }
        Relationships: Relationship[]
      }
      tasks: {
        Row: {
          id: string
          client_id: string | null
          proposal_id: string | null
          title: string
          description: string | null
          due_date: string | null
          reminder_sent_at: string | null
          assigned_to: string
          status: TaskStatus
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          proposal_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          reminder_sent_at?: string | null
          assigned_to: string
          status?: TaskStatus
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string | null
          proposal_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          reminder_sent_at?: string | null
          assigned_to?: string
          status?: TaskStatus
          created_at?: string
          completed_at?: string | null
        }
        Relationships: Relationship[]
      }
      activity_log: {
        Row: {
          id: string
          client_id: string
          user_id: string
          action: ActivityAction
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          user_id: string
          action: ActivityAction
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          user_id?: string
          action?: ActivityAction
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: Relationship[]
      }
      attachments: {
        Row: {
          id: string
          entity_type: EntityType
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: EntityType
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: EntityType
          entity_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          created_at?: string
        }
        Relationships: Relationship[]
      }
      settings: {
        Row: {
          key: string
          value: Record<string, unknown>
        }
        Insert: {
          key: string
          value: Record<string, unknown>
        }
        Update: {
          key?: string
          value?: Record<string, unknown>
        }
        Relationships: Relationship[]
      }
      services: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          deliverables: string[]
          prerequisites: string[]
          timeline_range: { min: number; max: number; unit: string }
          price_range: { min: number; max: number }
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description: string
          deliverables?: string[]
          prerequisites?: string[]
          timeline_range?: { min: number; max: number; unit: string }
          price_range?: { min: number; max: number }
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          deliverables?: string[]
          prerequisites?: string[]
          timeline_range?: { min: number; max: number; unit: string }
          price_range?: { min: number; max: number }
          is_active?: boolean
          updated_at?: string
        }
        Relationships: Relationship[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      client_stage: ClientStage
      audit_status: AuditStatus
      audit_mode: AuditMode
      proposal_status: ProposalStatus
      proposal_language: ProposalLanguage
      task_status: TaskStatus
      ai_provider: AIProvider
      ai_artifact_type: AIArtifactType
      activity_action: ActivityAction
      entity_type: EntityType
    }
  }
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type AuditSession = Database['public']['Tables']['audit_sessions']['Row']
export type Process = Database['public']['Tables']['processes']['Row']
export type Proposal = Database['public']['Tables']['proposals']['Row']
export type ProposalSnapshot = Database['public']['Tables']['proposal_snapshots']['Row']
export type AIArtifact = Database['public']['Tables']['ai_artifacts']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
export type Service = Database['public']['Tables']['services']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type AuditSessionInsert = Database['public']['Tables']['audit_sessions']['Insert']
export type ProcessInsert = Database['public']['Tables']['processes']['Insert']
export type ProposalInsert = Database['public']['Tables']['proposals']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']

// Update types
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type AuditSessionUpdate = Database['public']['Tables']['audit_sessions']['Update']
export type ProposalUpdate = Database['public']['Tables']['proposals']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Audit Script Types
export type QuestionStatus = 'pending' | 'asked' | 'done' | 'skipped'

export interface AuditScript {
  id: string
  name: string
  description: string | null
  created_by: string
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface AuditScriptSection {
  id: string
  script_id: string
  title: string
  order: number
  created_at: string
}

export interface AuditScriptQuestion {
  id: string
  section_id: string
  text: string
  order: number
  tags: string[]
  created_at: string
}

// Full script with nested sections and questions
export interface AuditScriptFull extends AuditScript {
  sections: (AuditScriptSection & {
    questions: AuditScriptQuestion[]
  })[]
}

// Per-session question state (stored in audit_sessions.structured_data.script_state)
export interface ScriptQuestionState {
  question_id: string
  status: QuestionStatus
  skip_reason?: string
  notes?: string
  asked_at?: string
  completed_at?: string
}

export interface SessionScriptState {
  active_script_id: string | null
  question_states: Record<string, ScriptQuestionState>
}
