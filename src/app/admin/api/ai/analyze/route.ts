import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routeAIRequest, type TaskType } from '@/lib/ai/router'
import {
  LIVE_SUMMARY_PROMPT,
  FOLLOW_UP_QUESTIONS_PROMPT,
  TOP_PROCESSES_PROMPT,
  ROI_ESTIMATE_PROMPT,
} from '@/lib/ai/prompts'
import type { AuditSession } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
