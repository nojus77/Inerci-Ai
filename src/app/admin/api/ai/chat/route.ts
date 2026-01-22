import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamAIResponse } from '@/lib/ai/router'
import { AUDIT_SYSTEM_PROMPT } from '@/lib/ai/prompts'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, sessionId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Start streaming in the background
    ;(async () => {
      try {
        let fullResponse = ''

        for await (const chunk of streamAIResponse({
          taskType: 'live_summary',
          messages,
          systemPrompt: AUDIT_SYSTEM_PROMPT,
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
