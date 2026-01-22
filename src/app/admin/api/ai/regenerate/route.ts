import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routeAIRequest } from '@/lib/ai/router'
import { SECTION_REGEN_PROMPT } from '@/lib/ai/prompts'

const SECTION_TITLES: Record<string, string> = {
  executive_summary: 'Executive Summary',
  current_state: 'Current State Assessment',
  opportunities: 'Prioritized Opportunities',
  pilot: 'Recommended Pilot',
  timeline: 'Timeline & Next Steps',
  risks: 'Risks & Assumptions',
  technical: 'Technical Architecture',
  pricing: 'Pricing Breakdown',
  case_studies: 'Evidence & Case Studies',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { proposalId, sectionId, instruction, currentContent, language } = await request.json()

    if (!proposalId || !sectionId || !instruction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sectionTitle = SECTION_TITLES[sectionId] || sectionId

    const prompt = SECTION_REGEN_PROMPT(sectionTitle, instruction)

    const fullPrompt = `${prompt}

Current content:
${currentContent || '(Empty section)'}

Language: ${language === 'lt' ? 'Lithuanian' : 'English'}

Generate the updated section content now.`

    const response = await routeAIRequest({
      taskType: 'section_regen',
      messages: [{ role: 'user', content: fullPrompt }],
    })

    // Update the proposal with the new section content
    const { data: proposalData } = await supabase
      .from('proposals')
      .select('content')
      .eq('id', proposalId)
      .single()

    if (proposalData) {
      const proposal = proposalData as { content: Record<string, string> }
      const updatedContent = {
        ...proposal.content,
        [sectionId]: response.content,
      }

      await supabase
        .from('proposals')
        .update({ content: updatedContent } as never)
        .eq('id', proposalId)
    }

    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
    })
  } catch (error) {
    console.error('Regenerate API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
