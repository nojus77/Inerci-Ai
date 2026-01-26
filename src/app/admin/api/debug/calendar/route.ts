import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SessionRow {
  id: string
  title: string
  status: string
  structured_data: Record<string, unknown> | null
  created_at: string
  client: { id: string; company_name: string; email: string } | null
}

interface TaskRow {
  id: string
  title: string
  due_date: string | null
  status: string
  created_at: string
  client: { id: string; company_name: string } | null
}

interface ClientRow {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  stage: string
  created_at: string
}

// Debug endpoint to check calendar data
export async function GET() {
  try {
    const supabase = await createClient()

    // Get all audit sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('audit_sessions')
      .select('id, title, status, structured_data, created_at, client:clients(id, company_name, email)')
      .order('created_at', { ascending: false })
      .limit(20)

    const sessions = sessionsData as unknown as SessionRow[] | null

    // Get all pending tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, status, created_at, client:clients(id, company_name)')
      .order('created_at', { ascending: false })
      .limit(20)

    const tasks = tasksData as unknown as TaskRow[] | null

    // Get all clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, contact_name, email, stage, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    const clients = clientsData as unknown as ClientRow[] | null

    // Check for specific email (the one from the booking)
    const { data: matchingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('email', 'baldu.idejos@yahoo.com')
      .single()

    return NextResponse.json({
      sessions: {
        count: sessions?.length || 0,
        error: sessionsError?.message,
        data: sessions?.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          scheduled_time: s.structured_data?.scheduled_time,
          cal_booking_id: s.structured_data?.cal_booking_id,
          client_email: s.client?.email,
          client_name: s.client?.company_name,
          created_at: s.created_at
        }))
      },
      tasks: {
        count: tasks?.length || 0,
        error: tasksError?.message,
        data: tasks?.map(t => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          status: t.status,
          client_name: t.client?.company_name
        }))
      },
      clients: {
        count: clients?.length || 0,
        error: clientsError?.message,
        data: clients?.map(c => ({
          id: c.id,
          company_name: c.company_name,
          contact_name: c.contact_name,
          email: c.email,
          stage: c.stage
        }))
      },
      specificClient: {
        searchEmail: 'baldu.idejos@yahoo.com',
        found: !!matchingClient,
        data: matchingClient
      },
      webhookUrl: 'https://inerci.lt/admin/api/webhooks/cal',
      instructions: 'Make sure this webhook URL is configured in Cal.com Settings → Webhooks'
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
