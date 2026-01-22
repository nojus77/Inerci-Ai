-- Seed script for Inerci Admin
-- Run this after migrations to create initial admin user

-- IMPORTANT: First create a user via Supabase Auth (Dashboard or API), then run this script
-- to set their role to admin. Replace the email below with your admin user's email.

-- Create admin user profile (assumes auth user already exists with this email)
-- You can also run this INSERT manually after creating the auth user
INSERT INTO users (id, email, name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Admin'),
  'admin'::user_role
FROM auth.users au
WHERE au.email = 'admin@inerci.ai'  -- Change to your admin email
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Alternative: If you want to create a user profile manually before auth signup
-- Uncomment and modify this:
-- INSERT INTO users (id, email, name, role) VALUES
--   ('your-uuid-here', 'admin@example.com', 'Admin User', 'admin');

-- Sample client for testing (optional)
INSERT INTO clients (company_name, contact_name, email, phone, stage, notes, tags)
VALUES (
  'Acme Corp',
  'John Doe',
  'john@acme.com',
  '+370 600 12345',
  'lead',
  'Sample client for testing the admin flow',
  ARRAY['demo', 'test']
) ON CONFLICT DO NOTHING;

-- Sample services
INSERT INTO services (slug, name, description, deliverables, prerequisites, timeline_range, price_range, is_active)
VALUES
  ('ai-audit', 'AI Readiness Audit', 'Comprehensive assessment of your business processes to identify AI automation opportunities.',
   ARRAY['Process analysis report', 'Opportunity ranking matrix', 'ROI projections', 'Implementation roadmap'],
   ARRAY['Access to key stakeholders', '2-hour discovery call'],
   '{"min": 1, "max": 2, "unit": "weeks"}',
   '{"min": 2000, "max": 5000}',
   true),
  ('pilot-build', 'Pilot Implementation', 'Build and deploy a proof-of-concept automation for your highest-impact process.',
   ARRAY['Working prototype', 'Integration documentation', 'Training session', '30-day support'],
   ARRAY['Completed AI Audit', 'Process owner availability'],
   '{"min": 2, "max": 4, "unit": "weeks"}',
   '{"min": 5000, "max": 15000}',
   true),
  ('full-deploy', 'Full Deployment', 'Scale successful pilots to production-grade solutions with ongoing support.',
   ARRAY['Production deployment', 'Monitoring dashboard', 'Team training', 'SLA-backed support'],
   ARRAY['Successful pilot', 'IT team coordination'],
   '{"min": 4, "max": 12, "unit": "weeks"}',
   '{"min": 15000, "max": 50000}',
   true)
ON CONFLICT (slug) DO NOTHING;
