# Audit & Proposal Copilot PRD

> Internal admin tool for Inerci AI to conduct AI-guided client audits and generate collaborative proposals.

---

## 1. Overview

### 1.1 Purpose
Enable the Inerci AI sales team to:
- Conduct structured client discovery audits via AI-assisted chat
- Identify and rank automation opportunities
- Generate editable, bilingual proposals
- Manage client pipeline and follow-ups

### 1.2 Users
- **Admin**: Full access + user/settings management
- **Sales**: Create/edit clients, sessions, proposals; run AI operations
- **Marketing**: Read-only access to clients, proposals, and AI artifacts

### 1.3 Tech Stack
- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage)
- Tiptap (rich text editor)
- Framer Motion (animations)
- OpenAI + Anthropic APIs (multi-provider LLM)

---

## 2. Features

### 2.1 Live Audit Mode
- Chat interface for conducting client discovery
- **Smart suggestions only**: AI suggests follow-up questions based on conversation context
- No auto-extraction or auto-populate of structured fields
- User manually fills summary cards from chat insights
- Explicit mode toggle: **Live Capture** (minimal UI, fast notes) vs **Refinement** (full editing)
- Process/opportunity cards: manually added, AI can suggest ranking

### 2.2 Proposal Editor
- Tiptap rich text editor (WYSIWYG)
- **Language**: Selectable per proposal (Lithuanian default, English option)
- Section-based structure with toggleable optional sections
- Prompt-based AI regeneration (select text → give instruction → regenerate)
- Comments for review workflow (optional approval)
- Manual snapshots for versioning

### 2.3 Internal CRM
- Client management with advanced filters
- Pipeline kanban (10 stages with DnD)
- Activity history per client
- Task system with automated reminders
- File attachments (basic uploads)

### 2.4 Integrations
- **Slack**: Configurable webhooks for key milestones
- **Cal.com**: Embed booking widget + link generation + webhook sync

### 2.5 Export
- Copy to clipboard (formatted)
- Download as Markdown
- Branded PDF (matches landing page style)

---

## 3. Data Model

### 3.1 Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales', 'marketing')),
  notification_prefs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN (
    'lead', 'audit_scheduled', 'audit_done', 'prototype_building',
    'prototype_delivered', 'proposal_draft', 'proposal_sent',
    'negotiation', 'won', 'lost', 'on_hold'
  )),
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Sessions
CREATE TABLE audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete', 'archived')),
  mode TEXT NOT NULL DEFAULT 'live_capture' CHECK (mode IN ('live_capture', 'refinement')),
  chat_messages JSONB[] DEFAULT '{}',
  structured_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processes (Opportunities)
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pain_points TEXT,
  volume_metrics TEXT,
  time_spent TEXT,
  frequency TEXT,
  owner TEXT,
  automation_potential INTEGER CHECK (automation_potential BETWEEN 1 AND 5),
  impact_score INTEGER,
  feasibility_score INTEGER,
  ai_assumptions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES audit_sessions(id),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'lt' CHECK (language IN ('en', 'lt')),
  content JSONB DEFAULT '{}',
  enabled_sections TEXT[] DEFAULT ARRAY[
    'executive_summary', 'current_state', 'opportunities',
    'recommended_pilots', 'timeline', 'risks'
  ],
  pricing_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review_requested', 'approved', 'sent')),
  review_comments JSONB[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal Snapshots
CREATE TABLE proposal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Artifacts
CREATE TABLE ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('session', 'proposal', 'client')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (key-value store)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (catalog)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  deliverables TEXT,
  prerequisites TEXT,
  timeline_range JSONB,
  price_range JSONB,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Application Routes

```
/src/app/admin/
├── layout.tsx                    # Admin shell
├── page.tsx                      # Dashboard
├── (auth)/
│   ├── login/page.tsx
│   └── callback/page.tsx
├── pipeline/page.tsx             # Kanban
├── clients/
│   ├── page.tsx                  # List
│   └── [id]/
│       ├── page.tsx              # Detail
│       ├── sessions/[sessionId]/page.tsx
│       └── proposals/[proposalId]/page.tsx
├── audit/[sessionId]/page.tsx    # Live Audit Mode
├── settings/
│   ├── page.tsx
│   ├── integrations/page.tsx
│   ├── pricing/page.tsx
│   ├── services/page.tsx
│   └── users/page.tsx
└── api/
    ├── ai/
    │   ├── chat/route.ts
    │   ├── analyze/route.ts
    │   ├── generate/route.ts
    │   └── regenerate/route.ts
    ├── webhooks/cal/route.ts
    ├── export/pdf/route.ts
    └── cron/reminders/route.ts
```

---

## 5. LLM Router

### Task Routing
| Task | Provider | Use Case |
|------|----------|----------|
| `suggestions` | OpenAI (GPT-4o-mini) | Real-time follow-up question suggestions |
| `ranking` | OpenAI (GPT-4o) | Process opportunity ranking |
| `roi_estimate` | OpenAI (GPT-4o) | Quick ROI calculations |
| `deep_analysis` | Claude (Sonnet) | Comprehensive process analysis |
| `proposal_draft` | Claude (Sonnet) | Full proposal generation |
| `section_regen` | Claude (Sonnet) | Section-level regeneration |

### Fallback Logic
- Primary provider fails → retry once with secondary
- Log provider/model used in `ai_artifacts` table
- Respect usage limits from settings

---

## 6. Proposal Structure

### Always Included
1. **Executive Summary** - High-level overview
2. **Current State** - Process scan highlights
3. **Prioritized Opportunities** - Ranked with ROI assumptions
4. **Recommended Pilot(s)** - Scope + success metrics
5. **Timeline & Next Steps** - Implementation roadmap
6. **Risks & Assumptions** - Flagged uncertainties

### Optional Sections (Toggle)
- Technical Architecture
- Tooling/Integrations
- Pricing Breakdown
- Evidence/Case Studies
- Data/Security Considerations
- Terms & Support/Maintenance

### Pricing Formula
```
price = (estimated_hours × hourly_rate × complexity_multiplier) + (integration_count × integration_cost)
```
- Admin configurable in settings
- AI proposes range, user can override

---

## 7. Pipeline Stages

```typescript
const STAGES = [
  'lead',
  'audit_scheduled',
  'audit_done',
  'prototype_building',
  'prototype_delivered',
  'proposal_draft',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
  'on_hold'
] as const;
```

Kanban rules: Sequential flow suggested, override requires reason input.

---

## 8. Roles & Permissions

| Action | Admin | Sales | Marketing |
|--------|:-----:|:-----:|:---------:|
| Manage users/settings | ✓ | | |
| Create/edit clients | ✓ | ✓ | |
| Create/edit sessions | ✓ | ✓ | |
| Run AI operations | ✓ | ✓ | |
| Create/edit proposals | ✓ | ✓ | |
| View all data | ✓ | ✓ | ✓ |

---

## 9. Security & Privacy

- **GDPR Compliance**: Data export, deletion, consent tracking
- **Data Anonymization**: Strip PII before external AI calls
- **Disclosure**: Document AI usage in materials
- **EU Data Residency**: Supabase EU region
- **Auth**: Supabase Auth with email/magic link

---

## 10. Build Checklist

### Phase 1: Foundation
- [ ] **1.1** Create Supabase project (EU region)
- [ ] **1.2** Set up environment variables
- [ ] **1.3** Run database migrations (all tables)
- [ ] **1.4** Implement Supabase client utilities
- [ ] **1.5** Set up Supabase Auth (email + magic link)
- [ ] **1.6** Create admin layout shell (sidebar, header)
- [ ] **1.7** Install and configure shadcn/ui
- [ ] **1.8** Implement role-based middleware
- [ ] **1.9** Create login page and auth callback

**Verification Gate 1:**
- [ ] Can create user accounts with roles
- [ ] Can log in/out successfully
- [ ] Role middleware blocks unauthorized routes
- [ ] Admin layout renders with sidebar

---

### Phase 2: CRM Core
- [ ] **2.1** Create Client model types and queries
- [ ] **2.2** Build ClientList component with filters
- [ ] **2.3** Build ClientForm (create/edit)
- [ ] **2.4** Build ClientDetail page with tabs
- [ ] **2.5** Implement activity logging utility
- [ ] **2.6** Build ActivityFeed component
- [ ] **2.7** Create KanbanBoard with DnD
- [ ] **2.8** Implement StageChangeModal (override reason)
- [ ] **2.9** Create Tasks CRUD
- [ ] **2.10** Build TaskList and TaskForm components

**Verification Gate 2:**
- [ ] Can create, edit, delete clients
- [ ] Filters work on client list
- [ ] Can drag clients between pipeline stages
- [ ] Stage override modal appears for non-sequential moves
- [ ] Activity log records all changes
- [ ] Can create and complete tasks

---

### Phase 3: Audit System
- [ ] **3.1** Create AuditSession model and queries
- [ ] **3.2** Build audit session list on client detail
- [ ] **3.3** Build AuditChat component
- [ ] **3.4** Implement AI suggestions endpoint (OpenAI)
- [ ] **3.5** Build SuggestionChips component
- [ ] **3.6** Build SummaryCards component (manual entry)
- [ ] **3.7** Implement ModeToggle (Live Capture / Refinement)
- [ ] **3.8** Create Process model and queries
- [ ] **3.9** Build ProcessList component
- [ ] **3.10** Build ProcessForm (create/edit)
- [ ] **3.11** Implement AI artifacts storage
- [ ] **3.12** Build ArtifactsView component

**Verification Gate 3:**
- [ ] Can create audit session for client
- [ ] Chat interface works with message history
- [ ] AI suggests follow-up questions in real-time
- [ ] Can manually add/edit summary cards
- [ ] Mode toggle changes UI complexity
- [ ] Can add/rank process opportunities
- [ ] AI artifacts are saved and viewable

---

### Phase 4: Proposal System
- [ ] **4.1** Create Proposal model and queries
- [ ] **4.2** Set up Tiptap editor with extensions
- [ ] **4.3** Build ProposalEditor page
- [ ] **4.4** Implement section toggle component
- [ ] **4.5** Build proposal generation endpoint (Claude)
- [ ] **4.6** Implement prompt-based regeneration
- [ ] **4.7** Build RegeneratePrompt dialog
- [ ] **4.8** Create PricingCalculator component
- [ ] **4.9** Implement pricing formula logic
- [ ] **4.10** Build CommentThread component
- [ ] **4.11** Implement review workflow (optional approval)
- [ ] **4.12** Build SnapshotManager component
- [ ] **4.13** Implement snapshot create/restore

**Verification Gate 4:**
- [ ] Can generate proposal from audit session
- [ ] Proposal editor loads with section structure
- [ ] Can toggle optional sections on/off
- [ ] Language selector works (LT default, EN option)
- [ ] Can select text and regenerate with prompt
- [ ] Pricing calculator shows formula breakdown
- [ ] Can override calculated pricing
- [ ] Can add review comments
- [ ] Can create and restore snapshots

---

### Phase 5: Export & Integrations
- [ ] **5.1** Implement clipboard export (formatted)
- [ ] **5.2** Implement markdown download
- [ ] **5.3** Build PDF template matching landing page
- [ ] **5.4** Implement PDF generation endpoint
- [ ] **5.5** Create ExportMenu component
- [ ] **5.6** Set up Slack webhook integration
- [ ] **5.7** Build Slack settings UI
- [ ] **5.8** Implement Slack notification utility
- [ ] **5.9** Embed Cal.com booking widget
- [ ] **5.10** Implement Cal.com link generation
- [ ] **5.11** Create Cal.com webhook handler
- [ ] **5.12** Auto-create session from Cal booking

**Verification Gate 5:**
- [ ] Can copy proposal to clipboard
- [ ] Can download as markdown file
- [ ] PDF export matches landing page branding
- [ ] Slack notifications fire on key milestones
- [ ] Cal.com widget embeds on client page
- [ ] Can generate Cal.com booking links
- [ ] Cal webhook creates audit session automatically

---

### Phase 6: Polish & Automation
- [ ] **6.1** Implement task reminder cron job
- [ ] **6.2** Build NotificationBadge component
- [ ] **6.3** Create in-app notification list
- [ ] **6.4** Add onboarding tooltips (first-visit)
- [ ] **6.5** Implement LLM usage limits
- [ ] **6.6** Add usage warning UI
- [ ] **6.7** Implement graceful error handling
- [ ] **6.8** Add loading skeletons throughout
- [ ] **6.9** Mobile responsive pass (all views)
- [ ] **6.10** Implement file attachments
- [ ] **6.11** Add services catalog management

**Verification Gate 6:**
- [ ] Task reminders send via Slack DM + in-app
- [ ] Notification badge shows unread count
- [ ] Tooltips appear on first visit
- [ ] Usage limits prevent excess AI calls
- [ ] Errors show user-friendly messages
- [ ] App works well on mobile viewport
- [ ] Can upload and view attachments

---

## 11. Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@hello-pangea/dnd": "^16.x",
  "openai": "^4.x",
  "@anthropic-ai/sdk": "^0.x",
  "@react-pdf/renderer": "^3.x",
  "date-fns": "^3.x",
  "zod": "^3.x",
  "zustand": "^4.x"
}
```

Plus shadcn/ui components via CLI.

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Integrations
SLACK_WEBHOOK_URL=
CAL_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 13. Success Criteria

1. Sales team can complete full audit → proposal workflow
2. Proposals generate in under 30 seconds
3. PDF export matches Inerci AI landing page branding
4. Pipeline kanban updates in real-time
5. Cal.com bookings auto-create audit sessions
6. Slack notifications arrive within 5 seconds of events
7. App is usable on mobile for quick tasks
8. All user roles have appropriate access restrictions
