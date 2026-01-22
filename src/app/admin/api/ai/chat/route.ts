import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamAIResponse } from '@/lib/ai/router'
import { AUDIT_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { requirePermission } from '@/lib/permissions-server'

export const runtime = 'nodejs'

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

    const { messages, sessionId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Fetch skipped questions and script state if sessionId provided
    let additionalContext = ''
    if (sessionId) {
      const { data: sessionData } = await supabase
        .from('audit_sessions')
        .select('structured_data')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        const structuredData = (sessionData as {
          structured_data: {
            skipped_questions?: Array<{ question: string; reason: string }>
            script_state?: {
              active_script_id: string | null
              question_states: Record<string, { status: string; skip_reason?: string }>
            }
          }
        }).structured_data

        // Skipped questions context
        const skipped = structuredData?.skipped_questions || []
        if (skipped.length > 0) {
          const skippedList = skipped.map((s) => {
            const reasonText = s.reason === 'not_relevant' ? 'neaktualu' : s.reason === 'already_discussed' ? 'jau aptarta' : 'praleista'
            return `- "${s.question}" (${reasonText})`
          }).join('\n')
          additionalContext += `\n\n## PRALEISTI KLAUSIMAI (NEKLAUSK PANAŠIŲ)\n${skippedList}`
        }

        // Script state context
        const scriptState = structuredData?.script_state
        if (scriptState?.active_script_id) {
          const questionStates = scriptState.question_states || {}
          const askedCount = Object.values(questionStates).filter(q => q.status === 'asked' || q.status === 'done').length
          const skippedCount = Object.values(questionStates).filter(q => q.status === 'skipped').length

          // Get skipped script questions
          const skippedScriptQuestions = Object.entries(questionStates)
            .filter(([, q]) => q.status === 'skipped' && q.skip_reason)
            .map(([, q]) => `- Praleista: ${q.skip_reason}`)
            .join('\n')

          additionalContext += `\n\n## SCRIPT'O BŪSENA\nPaklausta/atlikta: ${askedCount}, Praleista: ${skippedCount}`
          if (skippedScriptQuestions) {
            additionalContext += `\n${skippedScriptQuestions}`
          }
        }
      }
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Build system prompt with additional context
    const systemPrompt = AUDIT_SYSTEM_PROMPT + additionalContext

    // Start streaming in the background
    ;(async () => {
      try {
        let fullResponse = ''

        for await (const chunk of streamAIResponse({
          taskType: 'live_summary',
          messages,
          systemPrompt,
        })) {
          fullResponse += chunk
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
        }

        // Save the AI response to the session if provided
        if (sessionId) {
          const { data: sessionData } = await supabase
            .from('audit_sessions')
            .select('chat_messages')
            .eq('id', sessionId)
            .single()

          if (sessionData) {
            const existingMessages = (sessionData as { chat_messages: unknown[] }).chat_messages || []
            const updatedMessages = [
              ...existingMessages,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date().toISOString(),
              },
            ]

            await supabase
              .from('audit_sessions')
              .update({ chat_messages: updatedMessages } as never)
              .eq('id', sessionId)
          }
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'))
      } catch (error) {
        console.error('Streaming error:', error)
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
        )
      } finally {
        await writer.close()
      }
    })()

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
