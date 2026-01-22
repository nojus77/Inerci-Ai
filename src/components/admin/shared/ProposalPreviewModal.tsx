'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Calendar,
  Building,
  Clock,
  ExternalLink,
  Download,
  Globe,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

interface Proposal {
  id: string
  title: string
  status: string
  language: string
  content: Record<string, unknown> | null
  enabled_sections: string[] | null
  pricing_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
  client_id: string | null
  session_id: string | null
}

interface Client {
  id: string
  company_name: string
  contact_name: string
  email: string
}

interface ProposalPreviewModalProps {
  open: boolean
  onClose: () => void
  proposalId: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500',
  review_requested: 'bg-amber-500',
  approved: 'bg-emerald-500',
  sent: 'bg-blue-500',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review_requested: 'Review Requested',
  approved: 'Approved',
  sent: 'Sent',
}

export function ProposalPreviewModal({ open, onClose, proposalId }: ProposalPreviewModalProps) {
  const supabase = createClient()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProposal = useCallback(async () => {
    if (!proposalId) return

    setLoading(true)
    try {
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single()

      if (proposalData) {
        const proposal = proposalData as Proposal
        setProposal(proposal)

        if (proposal.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, company_name, contact_name, email')
            .eq('id', proposal.client_id)
            .single()

          if (clientData) {
            setClient(clientData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }, [proposalId, supabase])

  useEffect(() => {
    if (open && proposalId) {
      fetchProposal()
    }
  }, [open, proposalId, fetchProposal])

  if (!proposalId) return null

  // Get content sections
  const content = proposal?.content as Record<string, string> | null
  const sections = content ? Object.keys(content) : []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposal Preview
            </DialogTitle>
            {proposal && (
              <Badge className={`${STATUS_COLORS[proposal.status] || 'bg-slate-500'} text-white`}>
                {STATUS_LABELS[proposal.status] || proposal.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading proposal...</p>
          </div>
        ) : proposal ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Proposal Info */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{proposal.title}</h3>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {client && (
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4" />
                    {client.company_name}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {proposal.language === 'lt' ? 'Lithuanian' : 'English'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Created {format(new Date(proposal.created_at), 'PP')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Updated {formatDistanceToNow(new Date(proposal.updated_at), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Content Preview Tabs */}
            {sections.length > 0 ? (
              <Tabs defaultValue={sections[0]} className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
                  {sections.slice(0, 6).map((section) => (
                    <TabsTrigger
                      key={section}
                      value={section}
                      className="text-xs capitalize"
                    >
                      {section.replace(/_/g, ' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sections.map((section) => (
                  <TabsContent key={section} value={section} className="mt-3">
                    <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">
                        {typeof content?.[section] === 'string'
                          ? content[section]
                          : JSON.stringify(content?.[section], null, 2)}
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No content sections available. Edit the proposal to add content.
                </p>
              </div>
            )}

            {/* Pricing Info */}
            {proposal.pricing_data && Object.keys(proposal.pricing_data).length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Pricing</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(proposal.pricing_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enabled Sections */}
            {proposal.enabled_sections && proposal.enabled_sections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Enabled Sections</h4>
                <div className="flex flex-wrap gap-1.5">
                  {proposal.enabled_sections.map((section) => (
                    <Badge key={section} variant="outline" className="text-xs capitalize">
                      {section.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-muted-foreground">Proposal not found</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {proposal && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/proposals/${proposal.id}`}
                    onClick={onClose}
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/api/export/pdf?id=${proposal.id}`}
                    target="_blank"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export PDF
                  </Link>
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {proposal && client && (
              <Button asChild>
                <Link
                  href={`/admin/clients/${client.id}`}
                  onClick={onClose}
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  View Client
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
