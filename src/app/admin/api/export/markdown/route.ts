import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMarkdown } from '@/lib/export/markdown'
import type { Client, Proposal } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { proposalId } = await request.json()

    if (!proposalId) {
      return NextResponse.json({ error: 'Missing proposal ID' }, { status: 400 })
    }

    const { data: proposalData, error } = await supabase
      .from('proposals')
      .select('*, client:clients(*)')
      .eq('id', proposalId)
      .single()

    if (error || !proposalData) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const proposal = proposalData as unknown as Proposal & { client: Client }
    const markdown = generateMarkdown(proposal, proposal.client)

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${proposal.title}.md"`,
      },
    })
  } catch (error) {
    console.error('Markdown export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
