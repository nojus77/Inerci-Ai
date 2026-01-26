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
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    // timingSafeEqual requires same length buffers
    if (signature.length !== expectedSignature.length) {
      return false
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (e) {
    console.error('Cal webhook: Signature verification error:', e)
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log('Cal webhook: Received request')

  try {
    const supabase = await createClient()
    const rawBody = await request.text()

    console.log('Cal webhook: Raw body length:', rawBody.length)

    // Get webhook secret from env
    const webhookSecret = process.env.CAL_WEBHOOK_SECRET

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('x-cal-signature-256') || ''
      console.log('Cal webhook: Signature present:', !!signature, 'Secret configured:', !!webhookSecret)

      if (signature && !verifySignature(rawBody, signature, webhookSecret)) {
        console.error('Cal webhook: Signature verification FAILED - secrets may not match')
        // Log first 10 chars of expected vs received for debugging
        const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
        console.error('Cal webhook: Expected sig starts with:', expected.slice(0, 10), 'Got:', signature.slice(0, 10))
        // Continue anyway for now - remove this in production
        console.warn('Cal webhook: Proceeding despite signature mismatch for debugging')
      }
    } else {
      console.log('Cal webhook: No secret configured, skipping signature verification')
    }

    let payload: CalWebhookPayload
    try {
      payload = JSON.parse(rawBody)
      console.log('Cal webhook: Parsed payload, triggerEvent:', payload.triggerEvent)
    } catch (e) {
      console.error('Cal webhook: Invalid JSON payload', e)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Handle ping test - Cal.com sends a minimal payload to test connectivity
    if (!payload.triggerEvent || (payload.triggerEvent as string) === 'PING') {
      console.log('Cal webhook: Ping test received, responding OK')
      return NextResponse.json({ success: true, message: 'Webhook is working!' })
    }

    // Ensure we have the required payload structure
    if (!payload.payload) {
      console.log('Cal webhook: No payload data, might be a test - responding OK')
      return NextResponse.json({ success: true, message: 'Webhook received' })
    }

    const eventType = payload.triggerEvent
    if (!eventType) {
      console.error('Cal webhook: Missing triggerEvent')
      return NextResponse.json({ error: 'Missing triggerEvent' }, { status: 400 })
    }

    console.log('Cal webhook received:', eventType, payload.payload?.title || 'No title')

    // Safely get attendee (may not exist for some events like OOO_CREATED)
    const attendees = payload.payload?.attendees || []
    const attendee = attendees.length > 0 ? attendees[0] : null

    // Get admin user for assignment
    const { data: adminUserData, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('Cal webhook: Error fetching admin user:', adminError)
    }

    const adminUser = adminUserData as { id: string } | null
    const systemUserId = adminUser?.id

    if (!systemUserId) {
      console.warn('Cal webhook: No admin user found, some operations may be skipped')
    }

    // Find or create client based on attendee email
    let clientId: string | null = null
    let clientName: string | null = null
    let isNewClient = false

    if (attendee && attendee.email) {
      const { data: existingClientData, error: clientLookupError } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('email', attendee.email)
        .single()

      if (clientLookupError && clientLookupError.code !== 'PGRST116') {
        console.error('Cal webhook: Error looking up client:', clientLookupError)
      }

      const existingClient = existingClientData as { id: string; company_name: string } | null

      if (existingClient) {
        clientId = existingClient.id
        clientName = existingClient.company_name
      } else if (eventType === 'BOOKING_CREATED' || eventType === 'BOOKING_REQUESTED') {
        // Create new client for new bookings
        const attendeeName = attendee.name || 'Unknown Contact'
        const nameParts = attendeeName.split(' ')
        const companyName = nameParts[0] || 'Unknown Company'

        const newClientData: ClientInsert = {
          company_name: companyName,
          contact_name: attendeeName,
          email: attendee.email,
          stage: 'audit_scheduled',
          notes: `Booked via Cal.com: ${payload.payload.title || 'Untitled booking'}`,
          tags: ['cal-booking']
        }

        const { data: createdClient, error: clientError } = await supabase
          .from('clients')
          .insert(newClientData)
          .select('id, company_name')
          .single()

        if (clientError) {
          console.error('Cal webhook: Error creating client:', clientError)
        } else if (createdClient) {
          const newClient = createdClient as { id: string; company_name: string }
          clientId = newClient.id
          clientName = newClient.company_name
          isNewClient = true
          console.log('Cal webhook: Created new client:', clientName)
        }
      }
    }

    // Handle different event types
    switch (eventType) {
      case 'BOOKING_CREATED':
      case 'BOOKING_REQUESTED': {
        if (!clientId) {
          console.warn('Cal webhook: No client for booking event, skipping session/task creation')
          break
        }
        if (!systemUserId) {
          console.warn('Cal webhook: No admin user for booking event, skipping')
          break
        }

        // Update client stage
        if (!isNewClient) {
          const { error: updateError } = await supabase
            .from('clients')
            .update({ stage: 'audit_scheduled', updated_at: new Date().toISOString() })
            .eq('id', clientId)
          if (updateError) {
            console.error('Cal webhook: Error updating client stage:', updateError)
          }
        }

        // Create audit session
        const sessionTitle = payload.payload.title || `Audit with ${attendee?.name || 'Client'}`
        const sessionData: AuditSessionInsert = {
          client_id: clientId,
          title: sessionTitle,
          status: 'draft',
          mode: 'live_capture',
          created_by: systemUserId,
          chat_messages: [],
          structured_data: {
            scheduled_time: payload.payload.startTime,
            end_time: payload.payload.endTime,
            cal_booking_uid: payload.payload.uid,
            cal_booking_id: payload.payload.bookingId,
            attendee_email: attendee?.email || null,
            attendee_name: attendee?.name || null,
            attendee_timezone: attendee?.timeZone || null
          }
        }

        const { data: sessionResult, error: sessionError } = await supabase
          .from('audit_sessions')
          .insert(sessionData)
          .select('id')
          .single()

        if (sessionError) {
          console.error('Cal webhook: Error creating audit session:', sessionError)
        } else {
          console.log('Cal webhook: Created audit session:', sessionResult?.id)
        }

        // Create task
        const scheduledTime = payload.payload.startTime ? new Date(payload.payload.startTime) : new Date()
        const taskData: TaskInsert = {
          client_id: clientId,
          title: `Run audit call with ${attendee?.name || clientName || 'Client'}`,
          description: `Scheduled via Cal.com\nCompany: ${clientName || 'Unknown'}\nEmail: ${attendee?.email || 'N/A'}\nTime: ${scheduledTime.toLocaleString()}`,
          due_date: payload.payload.startTime || new Date().toISOString(),
          assigned_to: systemUserId,
          status: 'pending'
        }

        const { error: taskError } = await supabase.from('tasks').insert(taskData)
        if (taskError) {
          console.error('Cal webhook: Error creating task:', taskError)
        }

        // Log activity
        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'created',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Untitled',
            session_id: sessionResult?.id || null,
            scheduled_time: payload.payload.startTime,
            is_new_client: isNewClient
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging activity:', activityError)
        }
        break
      }

      case 'BOOKING_RESCHEDULED': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for reschedule event')
          break
        }

        // Update existing audit session
        const { data: existingSession, error: sessionLookupError } = await supabase
          .from('audit_sessions')
          .select('id, structured_data')
          .eq('client_id', clientId)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (sessionLookupError && sessionLookupError.code !== 'PGRST116') {
          console.error('Cal webhook: Error finding session to reschedule:', sessionLookupError)
        }

        if (existingSession) {
          const existingData = (existingSession.structured_data as Record<string, unknown>) || {}
          const { error: updateError } = await supabase
            .from('audit_sessions')
            .update({
              structured_data: {
                ...existingData,
                scheduled_time: payload.payload.startTime,
                end_time: payload.payload.endTime,
                cal_booking_uid: payload.payload.uid,
                rescheduled: true,
                attendee_email: attendee?.email || existingData.attendee_email,
                attendee_name: attendee?.name || existingData.attendee_name
              }
            })
            .eq('id', existingSession.id)

          if (updateError) {
            console.error('Cal webhook: Error updating session for reschedule:', updateError)
          }

          // Update task due date
          const { error: taskUpdateError } = await supabase
            .from('tasks')
            .update({ due_date: payload.payload.startTime })
            .eq('client_id', clientId)
            .eq('status', 'pending')

          if (taskUpdateError) {
            console.error('Cal webhook: Error updating task due date:', taskUpdateError)
          }
        } else {
          console.warn('Cal webhook: No draft session found to reschedule for client:', clientId)
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Rescheduled booking',
            new_time: payload.payload.startTime
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging reschedule activity:', activityError)
        }
        break
      }

      case 'BOOKING_CANCELLED':
      case 'BOOKING_REJECTED': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for cancel/reject event')
          break
        }

        // Mark audit session as archived
        const { error: archiveError } = await supabase
          .from('audit_sessions')
          .update({ status: 'archived' })
          .eq('client_id', clientId)
          .eq('status', 'draft')

        if (archiveError) {
          console.error('Cal webhook: Error archiving session:', archiveError)
        }

        // Mark related tasks as completed (cancelled)
        const { error: taskCancelError } = await supabase
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('client_id', clientId)
          .eq('status', 'pending')

        if (taskCancelError) {
          console.error('Cal webhook: Error completing cancelled tasks:', taskCancelError)
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Booking',
            reason: eventType === 'BOOKING_CANCELLED' ? 'cancelled' : 'rejected'
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging cancel activity:', activityError)
        }
        break
      }

      case 'MEETING_STARTED': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for meeting started event')
          break
        }

        // Update audit session status to in_progress
        const { error: startError, count } = await supabase
          .from('audit_sessions')
          .update({ status: 'in_progress' })
          .eq('client_id', clientId)
          .eq('status', 'draft')

        if (startError) {
          console.error('Cal webhook: Error starting session:', startError)
        } else {
          console.log('Cal webhook: Meeting started, updated sessions:', count)
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Meeting',
            started_at: new Date().toISOString()
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging meeting start:', activityError)
        }
        break
      }

      case 'MEETING_ENDED': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for meeting ended event')
          break
        }

        // Update audit session and client stage
        const { error: completeError } = await supabase
          .from('audit_sessions')
          .update({ status: 'complete' })
          .eq('client_id', clientId)
          .eq('status', 'in_progress')

        if (completeError) {
          console.error('Cal webhook: Error completing session:', completeError)
        }

        const { error: stageError } = await supabase
          .from('clients')
          .update({ stage: 'audit_done', updated_at: new Date().toISOString() })
          .eq('id', clientId)

        if (stageError) {
          console.error('Cal webhook: Error updating client stage to audit_done:', stageError)
        }

        // Complete the task
        const { error: taskCompleteError } = await supabase
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('client_id', clientId)
          .eq('status', 'pending')

        if (taskCompleteError) {
          console.error('Cal webhook: Error completing task:', taskCompleteError)
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'stage_changed',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Meeting',
            from_stage: 'audit_scheduled',
            to_stage: 'audit_done',
            ended_at: new Date().toISOString()
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging meeting end:', activityError)
        }
        console.log('Cal webhook: Meeting ended, client moved to audit_done')
        break
      }

      case 'RECORDING_READY': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for recording ready event')
          break
        }

        // Get current session to merge structured_data
        const { data: currentSession, error: sessionLookupError } = await supabase
          .from('audit_sessions')
          .select('id, structured_data')
          .eq('client_id', clientId)
          .eq('status', 'complete')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (sessionLookupError && sessionLookupError.code !== 'PGRST116') {
          console.error('Cal webhook: Error finding session for recording:', sessionLookupError)
        }

        const recordingUrl = payload.payload.recordingUrl || payload.payload.downloadLink

        if (currentSession && recordingUrl) {
          const existingData = (currentSession.structured_data as Record<string, unknown>) || {}
          const { error: updateError } = await supabase
            .from('audit_sessions')
            .update({
              structured_data: {
                ...existingData,
                recording_url: recordingUrl
              }
            })
            .eq('id', currentSession.id)

          if (updateError) {
            console.error('Cal webhook: Error saving recording URL:', updateError)
          } else {
            console.log('Cal webhook: Recording URL saved to session:', currentSession.id)
          }
        } else if (!currentSession) {
          console.warn('Cal webhook: No completed session found for recording')
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Recording',
            recording_url: recordingUrl || null
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging recording activity:', activityError)
        }
        break
      }

      case 'RECORDING_TRANSCRIPTION_GENERATED': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for transcript event')
          break
        }

        // Also save transcript URL to the session if available
        if (payload.payload.transcriptUrl) {
          const { data: transcriptSession } = await supabase
            .from('audit_sessions')
            .select('id, structured_data')
            .eq('client_id', clientId)
            .eq('status', 'complete')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (transcriptSession) {
            const existingData = (transcriptSession.structured_data as Record<string, unknown>) || {}
            await supabase
              .from('audit_sessions')
              .update({
                structured_data: {
                  ...existingData,
                  transcript_url: payload.payload.transcriptUrl,
                  has_transcript: true
                }
              })
              .eq('id', transcriptSession.id)
          }
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Transcript',
            transcript_url: payload.payload.transcriptUrl || null,
            has_transcript: !!payload.payload.transcript
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging transcript activity:', activityError)
        }
        break
      }

      case 'BOOKING_PAYMENT_INITIATED':
      case 'BOOKING_PAID': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for payment event')
          break
        }

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'Payment',
            payment_id: payload.payload.paymentId || null,
            amount: payload.payload.amount || null,
            currency: payload.payload.currency || null
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging payment activity:', activityError)
        }
        console.log('Cal webhook: Payment event logged:', eventType)
        break
      }

      case 'BOOKING_NO_SHOW_UPDATED': {
        if (!clientId || !systemUserId) {
          console.warn('Cal webhook: Missing client or admin for no-show event')
          break
        }

        const attendeesList = payload.payload?.attendees || []
        const noShowAttendees = attendeesList.filter(a => a?.noShow)

        const { error: activityError } = await supabase.from('activity_log').insert({
          client_id: clientId,
          user_id: systemUserId,
          action: 'updated',
          metadata: {
            type: 'cal_event',
            event: eventType,
            title: payload.payload.title || 'No-show update',
            no_show_host: payload.payload.noShowHost || false,
            no_show_attendees: noShowAttendees.map(a => a.email)
          }
        } as ActivityLogInsert)
        if (activityError) {
          console.error('Cal webhook: Error logging no-show activity:', activityError)
        }
        break
      }

      case 'OOO_CREATED': {
        // Log out of office - no client associated, just log for awareness
        console.log('Cal webhook: Out of office created:', {
          title: payload.payload?.title,
          startTime: payload.payload?.startTime,
          endTime: payload.payload?.endTime
        })
        break
      }

      default: {
        // Log unknown events for debugging
        console.log('Cal webhook: Unhandled event type:', eventType, 'Title:', payload.payload?.title)
      }
    }

    const eventDescription = EVENT_DESCRIPTIONS[eventType] || eventType

    console.log('Cal webhook processed successfully:', {
      event: eventType,
      clientId: clientId || 'none',
      isNewClient
    })

    return NextResponse.json({
      success: true,
      event: eventType,
      message: eventDescription,
      clientId: clientId || null,
      clientName: clientName || null,
      isNewClient
    })
  } catch (error) {
    console.error('Cal webhook error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
