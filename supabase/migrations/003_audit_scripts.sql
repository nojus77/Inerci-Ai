-- Audit Scripts System
-- Migration: 003_audit_scripts.sql

-- Audit Scripts table
CREATE TABLE IF NOT EXISTS audit_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_template BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Script Sections table
CREATE TABLE IF NOT EXISTS audit_script_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES audit_scripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Script Questions table
CREATE TABLE IF NOT EXISTS audit_script_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES audit_script_sections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_script_sections_script ON audit_script_sections(script_id);
CREATE INDEX IF NOT EXISTS idx_script_questions_section ON audit_script_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_audit_scripts_created_by ON audit_scripts(created_by);

-- Enable RLS
ALTER TABLE audit_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_script_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_script_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to manage scripts
CREATE POLICY "Users can view scripts" ON audit_scripts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create scripts" ON audit_scripts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update scripts" ON audit_scripts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete scripts" ON audit_scripts
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sections policies
CREATE POLICY "Users can view sections" ON audit_script_sections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create sections" ON audit_script_sections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update sections" ON audit_script_sections
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete sections" ON audit_script_sections
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Questions policies
CREATE POLICY "Users can view questions" ON audit_script_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create questions" ON audit_script_questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update questions" ON audit_script_questions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete questions" ON audit_script_questions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Updated_at trigger for audit_scripts
CREATE OR REPLACE FUNCTION update_audit_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_scripts_updated_at
  BEFORE UPDATE ON audit_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_scripts_updated_at();
