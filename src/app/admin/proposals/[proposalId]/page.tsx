'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProposalEditor } from '@/components/admin/proposals/ProposalEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Building, Save, Download, MoreHorizontal, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Proposal } from '@/types/database'

interface ProposalPageProps {
  params: Promise<{ proposalId: string }>
}

export default function ProposalPage({ params }: ProposalPageProps) {
  const { proposalId } = use(params)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [client, setClient] = useState<{ id: string; company_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchProposal = async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, client:clients(id, company_name)')
        .eq('id', proposalId)
        .single()

      if (error) {
        console.error('Error fetching proposal:', error)
      } else if (data) {
        const proposalData = data as unknown as Proposal & { client: { id: string; company_name: string } }
        setProposal(proposalData)
        setClient(proposalData.client)
      }
      setLoading(false)
    }

    fetchProposal()
  }, [proposalId, supabase])

  const handleSave = async (content: Record<string, unknown>) => {
    if (!proposal) return

    setSaving(true)
    const { error } = await supabase
      .from('proposals')
      .update({ content } as never)
      .eq('id', proposalId)

    if (!error) {
      setProposal({ ...proposal, content })
    }
    setSaving(false)
  }

  const handleStatusChange = async (status: 'draft' | 'review_requested' | 'approved' | 'sent') => {
    if (!proposal) return

    const { error } = await supabase
      .from('proposals')
      .update({ status } as never)
      .eq('id', proposalId)

    if (!error) {
      setProposal({ ...proposal, status })

      // If sent, update client stage
      if (status === 'sent' && client) {
        await supabase
          .from('clients')
          .update({ stage: 'proposal_sent' } as never)
          .eq('id', client.id)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('activity_log').insert({
            client_id: client.id,
            user_id: user.id,
            action: 'proposal_sent',
            metadata: { proposal_id: proposalId, proposal_title: proposal.title },
          } as never)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="h-14 border-b flex items-center px-4 gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="flex-1 m-4" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-muted-foreground">Proposal not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={client ? `/admin/clients/${client.id}` : '/admin/clients'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            {client && (
              <Link
                href={`/admin/clients/${client.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Building className="h-4 w-4" />
                <span className="text-sm">{client.company_name}</span>
              </Link>
            )}
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{proposal.title}</span>
            <Badge
              variant={
                proposal.status === 'sent'
                  ? 'default'
                  : proposal.status === 'approved'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {proposal.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}

          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          {proposal.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('review_requested')}
            >
              Request Review
            </Button>
          )}

          {proposal.status === 'approved' && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => handleStatusChange('sent')}
            >
              <Send className="h-4 w-4" />
              Mark as Sent
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                Set as Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('approved')}>
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                Mark as Sent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ProposalEditor
          proposalId={proposalId}
          content={proposal.content}
          enabledSections={proposal.enabled_sections}
          language={proposal.language}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
