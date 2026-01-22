import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routeAIRequest } from '@/lib/ai/router'
import { PROPOSAL_DRAFT_PROMPT } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { proposalId, sessionId, language } = await request.json()

    if (!proposalId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('audit_sessions')
      .select('*, client:clients(company_name)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = sessionData as { chat_messages: { role: string; content: string }[]; client: { company_name: string } }

    // Build context from conversation
    const conversationContext = (session.chat_messages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n\n')

    const clientName = session.client?.company_name || 'the client'

    // Generate proposal content
    const prompt = `${PROPOSAL_DRAFT_PROMPT}

Client: ${clientName}
Language: ${language === 'lt' ? 'Lithuanian' : 'English'}

Audit Conversation:
${conversationContext}

Generate the proposal content now. Structure it clearly with markdown headers for each section.`

    const response = await routeAIRequest({
      taskType: 'proposal_draft',
      messages: [{ role: 'user', content: prompt }],
    })

    // Parse the response into sections
    const sections: Record<string, string> = {}
    const content = response.content

    // Simple parsing - split by ## headers
    const sectionRegex = /## (.*?)\n([\s\S]*?)(?=## |$)/g
    let match

    while ((match = sectionRegex.exec(content)) !== null) {
      const title = match[1].toLowerCase().trim()
      const sectionContent = match[2].trim()

      // Map titles to section IDs
      if (title.includes('executive') || title.includes('summary')) {
        sections['executive_summary'] = sectionContent
      } else if (title.includes('current state') || title.includes('assessment')) {
        sections['current_state'] = sectionContent
      } else if (title.includes('opportunit') || title.includes('solution') || title.includes('recommend')) {
        sections['opportunities'] = sectionContent
      } else if (title.includes('pilot')) {
        sections['pilot'] = sectionContent
      } else if (title.includes('timeline') || title.includes('next step')) {
        sections['timeline'] = sectionContent
      } else if (title.includes('risk') || title.includes('assumption')) {
        sections['risks'] = sectionContent
      } else if (title.includes('technical') || title.includes('architecture')) {
        sections['technical'] = sectionContent
      } else if (title.includes('pricing') || title.includes('investment')) {
        sections['pricing'] = sectionContent
      }
    }

    // If parsing failed, put everything in executive summary
    if (Object.keys(sections).length === 0) {
      sections['executive_summary'] = content
    }

    // Update proposal with generated content
    await supabase
      .from('proposals')
      .update({ content: sections } as never)
      .eq('id', proposalId)

    // Store artifact
    await supabase.from('ai_artifacts').insert({
      session_id: sessionId,
      type: 'draft',
      content: content,
      provider: response.provider,
      model_id: response.model,
    } as never)

    return NextResponse.json({ success: true, sections })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
