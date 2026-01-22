import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import type { TablesInsert } from '@/lib/supabase/types'

type ClientInsert = TablesInsert<'clients'>
type AuditSessionInsert = TablesInsert<'audit_sessions'>
type TaskInsert = TablesInsert<'tasks'>
type ActivityLogInsert = TablesInsert<'activity_log'>

// All Cal.com webhook event types
type CalEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_REQUESTED'
  | 'BOOKING_PAYMENT_INITIATED'
  | 'BOOKING_PAID'
  | 'BOOKING_NO_SHOW_UPDATED'
  | 'MEETING_STARTED'
  | 'MEETING_ENDED'
  | 'RECORDING_READY'
  | 'RECORDING_TRANSCRIPTION_GENERATED'
  | 'OOO_CREATED'

interface CalAttendee {
  email: string
  name: string
  timeZone?: string
  language?: string
  noShow?: boolean
}

interface CalWebhookPayload {
  triggerEvent: CalEventType
  createdAt: string
  payload: {
    title: string
    description?: string
    startTime: string
    endTime: string
    uid?: string
    bookingId?: number
    status?: string
    attendees: CalAttendee[]
    organizer: {
      email: string
      name: string
      timeZone?: string
    }
    metadata?: Record<string, unknown>
    // Recording specific
    recordingUrl?: string
    downloadLink?: string
    // Transcript specific
    transcript?: string
    transcriptUrl?: string
    // Payment specific
    paymentId?: string
    amount?: number
    currency?: string
    // No-show specific
    noShowHost?: boolean
  }
}

// Human-readable event descriptions
const EVENT_DESCRIPTIONS: Record<CalEventType, string> = {
  BOOKING_CREATED: 'New booking created',
  BOOKING_RESCHEDULED: 'Booking rescheduled',
  BOOKING_CANCELLED: 'Booking cancelled',
  BOOKING_REJECTED: 'Booking rejected',
  BOOKING_REQUESTED: 'Booking requested (pending approval)',
  BOOKING_PAYMENT_INITIATED: 'Payment initiated',
  BOOKING_PAID: 'Payment completed',
  BOOKING_NO_SHOW_UPDATED: 'No-show status updated',
  MEETING_STARTED: 'Meeting started',
  MEETING_ENDED: 'Meeting ended',
  RECORDING_READY: 'Recording ready',
  RECORDING_TRANSCRIPTION_GENERATED: 'Transcript generated',
  OOO_CREATED: 'Out of office created',
}

// Verify Cal.com webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const rawBody = await request.text()

    // Get webhook secret from env
    const webhookSecret = process.env.CAL_WEBHOOK_SECRET

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('x-cal-signature-256') || ''
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('Cal webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload: CalWebhookPayload = JSON.parse(rawBody)
    const eventType = payload.triggerEvent
    console.log('Cal webhook received:', eventType, payload.payload.title)

    const attendee = payload.payload.attendees[0]

    // Get admin user for assignment
    const { data: adminUserData } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const adminUser = adminUserData as { id: string } | null
    const systemUserId = adminUser?.id

    // Find or create client based on attendee email
    let clientId: string | null = null
    let clientName: string | null = null
    let isNewClient = false

    if (attendee) {
      const { data: existingClientData } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('email', attendee.email)
        .single()

      const existingClient = existingClientData as { id: string; company_name: string } | null

      if (existingClient) {
        clientId = existingClient.id
        clientName = existingClient.company_name
      } else if (eventType === 'BOOKING_CREATED' || eventType === 'BOOKING_REQUESTED') {
        // Create new client for new bookings
        const nameParts = attendee.name.split(' ')
        const companyName = nameParts[0] || 'Unknown Company'

        const newClientData: ClientInsert = {
          company_name: companyName,
          contact_name: attendee.name,
          email: attendee.email,
          stage: 'audit_scheduled',
          notes: `Booked via Cal.com: ${payload.payload.title}`,
          tags: ['cal-booking']
        }

        const { data: createdClient, error: clientError } = await supabase
          .from('clients')
          .insert(newClientData)
          .select('id, company_name')
          .single()

        if (!clientError && createdClient) {
          const newClient = createdClient as { id: string; company_name: string }
          clientId = newClient.id
          clientName = newClient.company_name
          isNewClient = true
        }
      }
    }

    // Handle different event types
    switch (eventType) {
      case 'BOOKING_CREATED':
      case 'BOOKING_REQUESTED': {
        if (clientId && systemUserId) {
          // Update client stage
          if (!isNewClient) {
            await supabase
              .from('clients')
              .update({ stage: 'audit_scheduled', updated_at: new Date().toISOString() })
              .eq('id', clientId)
          }

          // Create audit session
          const sessionData: AuditSessionInsert = {
            client_id: clientId,
            title: payload.payload.title || `Audit with ${attendee?.name}`,
            status: 'draft',
            mode: 'live_capture',
            created_by: systemUserId,
            chat_messages: [],
            structured_data: {
              scheduled_time: payload.payload.startTime,
              end_time: payload.payload.endTime,
              cal_booking_uid: payload.payload.uid,
              cal_booking_id: payload.payload.bookingId,
              attendee_email: attendee?.email,
              attendee_name: attendee?.name,
              attendee_timezone: attendee?.timeZone
            }
          }

          const { data: sessionResult } = await supabase
            .from('audit_sessions')
            .insert(sessionData)
            .select('id')
            .single()

          // Create task
          const scheduledTime = new Date(payload.payload.startTime)
          const taskData: TaskInsert = {
            client_id: clientId,
            title: `Run audit call with ${attendee?.name}`,
            description: `Scheduled via Cal.com\nCompany: ${clientName}\nEmail: ${attendee?.email}\nTime: ${scheduledTime.toLocaleString()}`,
            due_date: payload.payload.startTime,
            assigned_to: systemUserId,
            status: 'pending'
          }

          await supabase.from('tasks').insert(taskData)

          // Log activity
          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'created',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              session_id: sessionResult?.id,
              scheduled_time: payload.payload.startTime,
              is_new_client: isNewClient
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'BOOKING_RESCHEDULED': {
        if (clientId && systemUserId) {
          // Update existing audit session
          const { data: existingSession } = await supabase
            .from('audit_sessions')
            .select('id')
            .eq('client_id', clientId)
            .eq('status', 'draft')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (existingSession) {
            await supabase
              .from('audit_sessions')
              .update({
                structured_data: {
                  scheduled_time: payload.payload.startTime,
                  end_time: payload.payload.endTime,
                  cal_booking_uid: payload.payload.uid,
                  rescheduled: true,
                  attendee_email: attendee?.email,
                  attendee_name: attendee?.name
                }
              })
              .eq('id', existingSession.id)

            // Update task due date
            await supabase
              .from('tasks')
              .update({ due_date: payload.payload.startTime })
              .eq('client_id', clientId)
              .eq('status', 'pending')
          }

          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              new_time: payload.payload.startTime
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'BOOKING_CANCELLED':
      case 'BOOKING_REJECTED': {
        if (clientId && systemUserId) {
          // Mark audit session as archived
          await supabase
            .from('audit_sessions')
            .update({ status: 'archived' })
            .eq('client_id', clientId)
            .eq('status', 'draft')

          // Mark related tasks as completed (cancelled)
          await supabase
            .from('tasks')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('client_id', clientId)
            .eq('status', 'pending')

          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              reason: eventType === 'BOOKING_CANCELLED' ? 'cancelled' : 'rejected'
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'MEETING_STARTED': {
        if (clientId && systemUserId) {
          // Update audit session status to in_progress
          await supabase
            .from('audit_sessions')
            .update({ status: 'in_progress' })
            .eq('client_id', clientId)
            .eq('status', 'draft')

          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              started_at: new Date().toISOString()
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'MEETING_ENDED': {
        if (clientId && systemUserId) {
          // Update audit session and client stage
          await supabase
            .from('audit_sessions')
            .update({ status: 'complete' })
            .eq('client_id', clientId)
            .eq('status', 'in_progress')

          await supabase
            .from('clients')
            .update({ stage: 'audit_done', updated_at: new Date().toISOString() })
            .eq('id', clientId)

          // Complete the task
          await supabase
            .from('tasks')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('client_id', clientId)
            .eq('status', 'pending')

          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'stage_changed',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              from_stage: 'audit_scheduled',
              to_stage: 'audit_done',
              ended_at: new Date().toISOString()
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'RECORDING_READY': {
        if (clientId && systemUserId) {
          // Get current session to merge structured_data
          const { data: currentSession } = await supabase
            .from('audit_sessions')
            .select('id, structured_data')
            .eq('client_id', clientId)
            .eq('status', 'complete')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (currentSession) {
            const existingData = (currentSession.structured_data as Record<string, unknown>) || {}
            await supabase
              .from('audit_sessions')
              .update({
                structured_data: {
                  ...existingData,
                  recording_url: payload.payload.recordingUrl || payload.payload.downloadLink
                }
              })
              .eq('id', currentSession.id)
          }

          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              recording_url: payload.payload.recordingUrl || payload.payload.downloadLink
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'RECORDING_TRANSCRIPTION_GENERATED': {
        if (clientId && systemUserId) {
          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              transcript_url: payload.payload.transcriptUrl,
              has_transcript: !!payload.payload.transcript
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'BOOKING_PAYMENT_INITIATED':
      case 'BOOKING_PAID': {
        if (clientId && systemUserId) {
          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              payment_id: payload.payload.paymentId,
              amount: payload.payload.amount,
              currency: payload.payload.currency
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'BOOKING_NO_SHOW_UPDATED': {
        if (clientId && systemUserId) {
          const noShowAttendees = payload.payload.attendees.filter(a => a.noShow)

          await supabase.from('activity_log').insert({
            client_id: clientId,
            user_id: systemUserId,
            action: 'updated',
            metadata: {
              type: 'cal_event',
              event: eventType,
              title: payload.payload.title,
              no_show_host: payload.payload.noShowHost,
              no_show_attendees: noShowAttendees.map(a => a.email)
            }
          } as ActivityLogInsert)
        }
        break
      }

      case 'OOO_CREATED': {
        // Log out of office - no client associated
        if (systemUserId) {
          console.log('Out of office created:', payload.payload)
        }
        break
      }

      default: {
        console.log('Unhandled Cal event type:', eventType)
      }
    }

    const eventDescription = EVENT_DESCRIPTIONS[eventType] || eventType

    return NextResponse.json({
      success: true,
      event: eventType,
      message: eventDescription,
      clientId,
      isNewClient
    })
  } catch (error) {
    console.error('Cal webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
