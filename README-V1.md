# Inerci Admin - V1 Setup Guide

Internal admin tool for conducting AI-guided client audits and generating collaborative proposals.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- Optional: OpenAI API key, Anthropic API key, Slack webhook URL

## Quick Start

### 1. Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required environment variables:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (optional - needed for AI features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Integrations (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
CAL_WEBHOOK_SECRET=your-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to SQL Editor and run the migration:
   ```bash
   # Copy contents of supabase/migrations/001_initial_schema.sql
   # Paste into Supabase SQL Editor and run
   ```

3. Create your admin user:
   - Go to Authentication > Users > Add User
   - Create user with email/password
   - Note the user's UUID

4. Run the seed script (modify email first):
   ```sql
   -- In SQL Editor, run supabase/seed.sql
   -- First update the admin email on line 11 to match your user
   ```

### 3. Run the App

```bash
npm install
npm run dev
```

Visit http://localhost:3000/admin/login

## Smoke Test Checklist

### Authentication
- [ ] Login page loads at `/admin/login`
- [ ] Can log in with email/password
- [ ] Redirects to `/admin` after login
- [ ] Sidebar shows user info

### Clients
- [ ] Client list loads at `/admin/clients`
- [ ] Can create new client via "Add Client" button
- [ ] Can view client detail page
- [ ] Tags and stage badge display correctly

### Pipeline
- [ ] Kanban board loads at `/admin/pipeline`
- [ ] Client cards show in correct stage columns
- [ ] Can drag-drop client between stages
- [ ] Stage change modal appears for non-sequential moves

### Audit Sessions
- [ ] Can create new audit from client detail
- [ ] Audit chat interface loads
- [ ] Can send messages in chat
- [ ] Messages persist after page refresh
- [ ] Can toggle Live/Refinement mode
- [ ] Can mark audit as complete (updates client stage)

### Proposals
- [ ] Can create proposal from audit or client
- [ ] Tiptap editor loads with sections
- [ ] Can edit proposal content
- [ ] Can save changes
- [ ] Export to Markdown works
- [ ] Export to PDF works (downloads file)

### Tasks
- [ ] Task list loads at `/admin/tasks`
- [ ] Can create new task
- [ ] Can mark task as complete
- [ ] Due date displays correctly

### Settings
- [ ] Settings pages load
- [ ] Can update Slack webhook URL
- [ ] Can update Cal.com settings
- [ ] Can manage services catalog

## Slack Integration

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable Incoming Webhooks
3. Create webhook for your channel
4. Add webhook URL in Admin > Settings > Integrations
5. Enable desired events (proposal_sent, stage_changed, etc.)

Test: Change a client's stage - should post to Slack.

## Cal.com Integration

1. Set up Cal.com account
2. Create an event type for audit calls
3. Go to Cal.com Developer > Webhooks
4. Add webhook URL: `https://your-domain.com/admin/api/webhooks/cal`
5. Set a webhook secret
6. Enable "Booking Created" trigger
7. Add the secret in Admin > Settings > Integrations

Expected behavior when booking is created:
- New client created (or existing client found by email)
- Client stage updated to "audit_scheduled"
- Audit session created with scheduled time
- Task created for the audit call

### Cal.com Webhook Payload (for reference)

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2024-01-15T10:00:00Z",
  "payload": {
    "title": "AI Audit Call",
    "startTime": "2024-01-20T14:00:00Z",
    "endTime": "2024-01-20T15:00:00Z",
    "attendees": [
      { "email": "client@company.com", "name": "John Doe" }
    ],
    "organizer": {
      "email": "admin@inerci.ai",
      "name": "Admin"
    }
  }
}
```

## AI Features

AI features require API keys in `.env.local`:

- **Chat suggestions**: Uses OpenAI for quick responses
- **Deep analysis**: Uses Claude for thorough process analysis
- **Proposal generation**: Uses Claude to draft proposal sections
- **Section regeneration**: Uses Claude with custom prompts

Without API keys, AI features will show error messages but the app remains functional.

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after changing env vars

### "Auth callback error"
- Check that your Supabase project URL is correct
- Verify the site URL is set correctly in Supabase Auth settings

### Pipeline drag-drop not working
- Ensure RLS policies are applied (run migration)
- Check browser console for errors

### PDF export blank
- Ensure proposal has content
- Check browser console for PDF generation errors

## Architecture Notes

- `/src/app/admin/` - All admin routes (App Router)
- `/src/components/admin/` - Admin UI components
- `/src/lib/supabase/` - Supabase client and helpers
- `/src/lib/ai/` - AI provider routing and prompts
- `/src/types/database.ts` - Supabase database types

## Known Limitations (V1)

- No real-time updates (uses polling/refresh)
- PDF export has basic branding
- AI prompts not optimized
- No file attachments yet
- Single-tenant (no org/team separation)
