'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, Sparkles } from 'lucide-react'
import type { Client, AuditSession, ProposalLanguage } from '@/types/database'

function NewProposalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSessionId = searchParams.get('session')
  const preselectedClientId = searchParams.get('client')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [sessions, setSessions] = useState<(AuditSession & { client: { id: string; company_name: string } })[]>([])

  const [formData, setFormData] = useState({
    title: '',
    client_id: preselectedClientId || '',
    session_id: preselectedSessionId || '',
    language: 'en' as ProposalLanguage,
    generateFromSession: !!preselectedSessionId,
  })

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, sessionsRes] = await Promise.all([
        supabase.from('clients').select('*').order('company_name'),
        supabase.from('audit_sessions').select('*, client:clients(id, company_name)').eq('status', 'complete').order('updated_at', { ascending: false }),
      ])

      if (clientsRes.data) setClients(clientsRes.data as unknown as Client[])
      if (sessionsRes.data) setSessions(sessionsRes.data as unknown as (AuditSession & { client: { id: string; company_name: string } })[])

      // Auto-set values if session is preselected
      if (preselectedSessionId && sessionsRes.data) {
        const sessionsData = sessionsRes.data as unknown as (AuditSession & { client: { id: string; company_name: string } })[]
        const session = sessionsData.find((s) => s.id === preselectedSessionId)
        if (session) {
          const client = session.client
          setFormData((prev) => ({
            ...prev,
            client_id: client.id,
            title: `AI Automation Proposal - ${client.company_name}`,
          }))
        }
      }
    }

    fetchData()
  }, [supabase, preselectedSessionId])

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId, session_id: '' })

    const client = clients.find((c) => c.id === clientId)
    if (client && !formData.title) {
      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
        title: `AI Automation Proposal - ${client.company_name}`,
      }))
    }
  }

  const clientSessions = sessions.filter(
    (s) => s.client?.id === formData.client_id
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create empty proposal
      const { data: proposalData, error: insertError } = await supabase
        .from('proposals')
        .insert({
          title: formData.title,
          client_id: formData.client_id,
          session_id: formData.session_id || null,
          language: formData.language,
          created_by: user.id,
          status: 'draft',
          content: {},
          enabled_sections: [
            'executive_summary',
            'current_state',
            'opportunities',
            'pilot',
            'timeline',
            'risks',
          ],
          pricing_data: {
            hours_estimate: 0,
            hourly_rate: 150,
            complexity_multiplier: 1,
            integration_cost: 0,
          },
        } as never)
        .select()
        .single()

      if (insertError) throw insertError

      const proposal = proposalData as unknown as { id: string }

      // If generating from session, call the generate API
      if (formData.generateFromSession && formData.session_id) {
        setGenerating(true)
        const response = await fetch('/admin/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: proposal.id,
            sessionId: formData.session_id,
            language: formData.language,
          }),
        })

        if (!response.ok) {
          console.error('Failed to generate proposal content')
        }
      }

      router.push(`/admin/proposals/${proposal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="New Proposal" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Proposal
            </CardTitle>
            <CardDescription>
              Generate a new proposal, optionally from an audit session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., AI Automation Proposal"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(v) =>
                      setFormData({ ...formData, language: v as ProposalLanguage })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="lt">Lithuanian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Generate from Audit (optional)</Label>
                  <Select
                    value={formData.session_id || 'none'}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        session_id: v === 'none' ? '' : v,
                        generateFromSession: v !== 'none' && !!v,
                      })
                    }
                    disabled={!formData.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.client_id ? 'Select session' : 'Select client first'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No session (blank proposal)</SelectItem>
                      {clientSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.generateFromSession && formData.session_id && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    AI will generate proposal content based on the audit session.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.client_id}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {generating ? 'Generating...' : 'Create Proposal'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewProposalContent />
    </Suspense>
  )
}
