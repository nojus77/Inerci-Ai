import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Status endpoint to check webhook configuration and recent events
// GET /admin/api/webhooks/cal/status
export async function GET() {
  try {
    const supabase = await createClient()

    // Check for admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'admin')
      .limit(1)
      .single()

    // Count recent clients with cal-booking tag
    const { count: calBookingClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .contains('tags', ['cal-booking'])

    // Get recent audit sessions with scheduled_time
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('audit_sessions')
      .select('id, title, status, structured_data, created_at')
      .not('structured_data', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent activity log entries for cal events
    const { data: recentActivity, error: activityError } = await supabase
      .from('activity_log')
      .select('id, action, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    interface SessionRow {
      id: string
      title: string
      status: string
      structured_data: Record<string, unknown> | null
      created_at: string
    }

    interface ActivityRow {
      id: string
      action: string
      metadata: Record<string, unknown> | null
      created_at: string
    }

    const sessions = recentSessions as unknown as SessionRow[] | null
    const calActivity = (recentActivity as unknown as ActivityRow[] | null)?.filter(
      a => (a.metadata as Record<string, unknown>)?.type === 'cal_event'
    )

    return NextResponse.json({
      status: 'OK',
      configuration: {
        webhookSecret: process.env.CAL_WEBHOOK_SECRET ? 'configured' : 'NOT configured',
        adminUser: adminUser ? { id: adminUser.id, email: adminUser.email } : 'NOT FOUND - webhook will fail!',
        adminError: adminError?.message || null,
      },
      stats: {
        clientsFromCalBooking: calBookingClients || 0,
      },
      recentSessions: {
        error: sessionsError?.message,
        data: sessions?.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          scheduled_time: (s.structured_data as Record<string, unknown>)?.scheduled_time,
          cal_booking_id: (s.structured_data as Record<string, unknown>)?.cal_booking_id,
          created_at: s.created_at,
        })),
      },
      recentCalActivity: {
        error: activityError?.message,
        count: calActivity?.length || 0,
        data: calActivity?.map(a => ({
          id: a.id,
          action: a.action,
          event: (a.metadata as Record<string, unknown>)?.event,
          title: (a.metadata as Record<string, unknown>)?.title,
          created_at: a.created_at,
        })),
      },
      help: {
        webhookUrl: 'https://inerci.lt/admin/api/webhooks/cal (try without www)',
        testEndpoint: '/admin/api/webhooks/cal/test (GET request to simulate a booking)',
        events: 'Make sure BOOKING_CREATED is enabled in Cal.com webhook settings',
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
