import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routeAIRequest, type TaskType } from '@/lib/ai/router'
import {
  LIVE_SUMMARY_PROMPT,
  FOLLOW_UP_QUESTIONS_PROMPT,
  TOP_PROCESSES_PROMPT,
  ROI_ESTIMATE_PROMPT,
  NEXT_QUESTIONS_PROMPT,
} from '@/lib/ai/prompts'
import { requirePermission } from '@/lib/permissions-server'
import type { AuditSession } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check AI permission
    const { allowed, error } = await requirePermission('run_ai')
    if (!allowed) return error

    const { sessionId, analysisType } = await request.json()

    if (!sessionId || !analysisType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the session and its messages
    const { data: sessionData, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = sessionData as AuditSession

    // Build conversation context from chat messages
    const conversationContext = (session.chat_messages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n\n')

    // Get the appropriate prompt
    let prompt: string
    let taskType: TaskType

    switch (analysisType) {
      case 'summary':
        prompt = `${LIVE_SUMMARY_PROMPT}\n\nConversation:\n${conversationContext}`
        taskType = 'live_summary'
        break
      case 'follow_up':
        prompt = `${FOLLOW_UP_QUESTIONS_PROMPT}\n\nConversation:\n${conversationContext}`
        taskType = 'follow_up_questions'
        break
      case 'processes':
        prompt = `${TOP_PROCESSES_PROMPT}\n\nConversation:\n${conversationContext}`
        taskType = 'top_processes'
        break
      case 'roi':
        prompt = `${ROI_ESTIMATE_PROMPT}\n\nConversation:\n${conversationContext}`
        taskType = 'roi_estimate'
        break
      case 'next_questions':
        // Include skipped questions context
        const skipped = (session.structured_data as { skipped_questions?: Array<{ question: string; reason: string }> })?.skipped_questions || []
        let skippedContext = ''
        if (skipped.length > 0) {
          const skippedList = skipped.map((s) => {
            const reasonText = s.reason === 'not_relevant' ? 'neaktualu' : s.reason === 'already_discussed' ? 'jau aptarta' : 'praleista'
            return `- "${s.question}" (${reasonText})`
          }).join('\n')
          skippedContext = `\n\nPRALEISTI KLAUSIMAI (NEKLAUSTI PANAŠIŲ):\n${skippedList}`
        }
        prompt = `${NEXT_QUESTIONS_PROMPT}${skippedContext}\n\nConversation:\n${conversationContext}`
        taskType = 'follow_up_questions'
        break
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    }

    // Call the AI
    const response = await routeAIRequest({
      taskType,
      messages: [{ role: 'user', content: prompt }],
    })

    // Store the artifact
    await supabase.from('ai_artifacts').insert({
      session_id: sessionId,
      type: analysisType === 'follow_up' ? 'suggestions' : analysisType,
      content: response.content,
      provider: response.provider,
      model_id: response.model,
    } as never)

    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
    })
  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
