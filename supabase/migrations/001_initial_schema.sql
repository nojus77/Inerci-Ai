-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'marketing');
CREATE TYPE client_stage AS ENUM (
  'lead', 'audit_scheduled', 'audit_done', 'prototype_building',
  'prototype_delivered', 'proposal_draft', 'proposal_sent',
  'negotiation', 'won', 'lost', 'on_hold'
);
CREATE TYPE audit_status AS ENUM ('draft', 'in_progress', 'complete', 'archived');
CREATE TYPE audit_mode AS ENUM ('live_capture', 'refinement');
CREATE TYPE proposal_status AS ENUM ('draft', 'review_requested', 'approved', 'sent');
CREATE TYPE proposal_language AS ENUM ('en', 'lt');
CREATE TYPE task_status AS ENUM ('pending', 'completed');
CREATE TYPE ai_provider AS ENUM ('openai', 'claude');
CREATE TYPE ai_artifact_type AS ENUM ('summary', 'analysis', 'suggestions', 'draft', 'section');
CREATE TYPE activity_action AS ENUM ('created', 'updated', 'stage_changed', 'proposal_sent', 'note_added', 'task_completed');
CREATE TYPE entity_type AS ENUM ('session', 'proposal', 'client');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'sales',
  notification_prefs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  stage client_stage DEFAULT 'lead',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit sessions table
CREATE TABLE audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status audit_status DEFAULT 'draft',
  mode audit_mode DEFAULT 'live_capture',
  chat_messages JSONB[] DEFAULT '{}',
  structured_data JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processes (opportunities identified in audits)
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  pain_points TEXT,
  volume_metrics TEXT,
  time_spent TEXT,
  frequency TEXT,
  owner TEXT,
  automation_potential INTEGER DEFAULT 3 CHECK (automation_potential BETWEEN 1 AND 5),
  impact_score INTEGER DEFAULT 3 CHECK (impact_score BETWEEN 1 AND 5),
  feasibility_score INTEGER DEFAULT 3 CHECK (feasibility_score BETWEEN 1 AND 5),
  ai_assumptions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES audit_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  language proposal_language DEFAULT 'en',
  content JSONB DEFAULT '{}',
  enabled_sections TEXT[] DEFAULT '{}',
  pricing_data JSONB DEFAULT '{}',
  status proposal_status DEFAULT 'draft',
  review_comments JSONB[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal snapshots
CREATE TABLE proposal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI artifacts
CREATE TABLE ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  type ai_artifact_type NOT NULL,
  content TEXT NOT NULL,
  provider ai_provider NOT NULL,
  model_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status task_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action activity_action NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (singleton per key)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Services catalog
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  timeline_range JSONB DEFAULT '{"min": 1, "max": 4, "unit": "weeks"}',
  price_range JSONB DEFAULT '{"min": 0, "max": 0}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_clients_stage ON clients(stage);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_audit_sessions_client_id ON audit_sessions(client_id);
CREATE INDEX idx_audit_sessions_status ON audit_sessions(status);
CREATE INDEX idx_proposals_client_id ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_activity_log_client_id ON activity_log(client_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_sessions_updated_at BEFORE UPDATE ON audit_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (enable RLS on all tables)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (all authenticated users can read/write for now)
-- In production, refine these based on role
CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admin can manage clients" ON clients FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sessions" ON audit_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admin can manage sessions" ON audit_sessions FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view processes" ON processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admin can manage processes" ON processes FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view proposals" ON proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admin can manage proposals" ON proposals FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view snapshots" ON proposal_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admin can manage snapshots" ON proposal_snapshots FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view artifacts" ON ai_artifacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admin can manage artifacts" ON ai_artifacts FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tasks" ON tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view activity" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can log activity" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view attachments" ON attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage attachments" ON attachments FOR ALL TO authenticated USING (true);

CREATE POLICY "Admin can manage settings" ON settings FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view services" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage services" ON services FOR ALL TO authenticated USING (true);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('pricing_config', '{"base_rate": 150, "complexity_multipliers": {"low": 1, "medium": 1.5, "high": 2}, "integration_cost": 500}'),
  ('slack_config', '{"webhook_url": "", "channel_mapping": {}, "enabled_events": ["proposal_sent", "stage_changed"]}'),
  ('cal_config', '{"embed_link": "", "webhook_secret": ""}'),
  ('llm_config', '{"usage_limits": {"daily_openai": 100, "daily_claude": 50}, "task_routing": {}}');
