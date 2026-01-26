import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@/lib/supabase/types'

type ClientInsert = TablesInsert<'clients'>
type AuditSessionInsert = TablesInsert<'audit_sessions'>
type TaskInsert = TablesInsert<'tasks'>

interface CalBooking {
  id: number
  uid: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  attendees: Array<{
    email: string
    name: string
    timeZone?: string
  }>
  user: {
    email: string
    name: string
    timeZone?: string
  }
}

interface CalApiResponse {
  bookings: CalBooking[]
}

export async function POST() {
  try {
    const supabase = await createClient()

    // Get Cal.com API key from settings
    const { data: calSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cal_config')
      .single()

    const calConfig = calSettings?.value as { api_key?: string } | null

    if (!calConfig?.api_key) {
      return NextResponse.json(
        { error: 'Cal.com API key not configured. Go to Settings → Integrations to add it.' },
        { status: 400 }
      )
    }

    // Get admin user for assignment
    const { data: adminUserData } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const systemUserId = adminUserData?.id

    if (!systemUserId) {
      return NextResponse.json(
        { error: 'No admin user found in the system' },
        { status: 400 }
      )
    }

    // Fetch bookings from Cal.com API
    const calResponse = await fetch(
      `https://api.cal.com/v1/bookings?apiKey=${calConfig.api_key}&status=upcoming,past`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!calResponse.ok) {
      const errorText = await calResponse.text()
      console.error('Cal.com API error:', errorText)
      return NextResponse.json(
        { error: `Cal.com API error: ${calResponse.status}` },
        { status: calResponse.status }
      )
    }

    const calData: CalApiResponse = await calResponse.json()
    const bookings = calData.bookings || []

    let synced = 0
    let skipped = 0
    let errors = 0

    for (const booking of bookings) {
      try {
        const attendee = booking.attendees?.[0]
        if (!attendee?.email) {
          skipped++
          continue
        }

        // Check if we already have an audit session for this booking
        const { data: existingSession } = await supabase
          .from('audit_sessions')
          .select('id')
          .contains('structured_data', { cal_booking_id: booking.id })
          .single()

        if (existingSession) {
          skipped++
          continue
        }

        // Find or create client
        let clientId: string
        let clientName: string

        const { data: existingClient } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('email', attendee.email)
          .single()

        if (existingClient) {
          clientId = existingClient.id
          clientName = existingClient.company_name
        } else {
          // Create new client
          const attendeeName = attendee.name || 'Unknown Contact'
          const nameParts = attendeeName.split(' ')
          const companyName = nameParts[0] || 'Unknown Company'

          const newClientData: ClientInsert = {
            company_name: companyName,
            contact_name: attendeeName,
            email: attendee.email,
            stage: booking.status === 'CANCELLED' ? 'lead' : 'audit_scheduled',
            notes: `Synced from Cal.com: ${booking.title || 'Untitled booking'}`,
            tags: ['cal-sync'],
          }

          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert(newClientData)
            .select('id, company_name')
            .single()

          if (clientError || !newClient) {
            console.error('Error creating client:', clientError)
            errors++
            continue
          }

          clientId = newClient.id
          clientName = newClient.company_name
        }

        // Create audit session
        const sessionTitle = booking.title || `Audit with ${attendee.name || 'Client'}`
        const sessionData: AuditSessionInsert = {
          client_id: clientId,
          title: sessionTitle,
          status: booking.status === 'CANCELLED' ? 'archived' : 'draft',
          mode: 'live_capture',
          created_by: systemUserId,
          chat_messages: [],
          structured_data: {
            scheduled_time: booking.startTime,
            end_time: booking.endTime,
            cal_booking_uid: booking.uid,
            cal_booking_id: booking.id,
            attendee_email: attendee.email,
            attendee_name: attendee.name,
            attendee_timezone: attendee.timeZone,
            synced_from_api: true,
          },
        }

        const { error: sessionError } = await supabase
          .from('audit_sessions')
          .insert(sessionData)

        if (sessionError) {
          console.error('Error creating session:', sessionError)
          errors++
          continue
        }

        // Create task for non-cancelled bookings
        if (booking.status !== 'CANCELLED') {
          const scheduledTime = new Date(booking.startTime)
          const taskData: TaskInsert = {
            client_id: clientId,
            title: `Run audit call with ${attendee.name || clientName}`,
            description: `Synced from Cal.com\nCompany: ${clientName}\nEmail: ${attendee.email}\nTime: ${scheduledTime.toLocaleString()}`,
            due_date: booking.startTime,
            assigned_to: systemUserId,
            status: 'pending',
          }

          await supabase.from('tasks').insert(taskData)
        }

        synced++
      } catch (err) {
        console.error('Error processing booking:', err)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      total: bookings.length,
      synced,
      skipped,
      errors,
      message: `Synced ${synced} bookings, skipped ${skipped} (already exist), ${errors} errors`,
    })
  } catch (error) {
    console.error('Cal sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
