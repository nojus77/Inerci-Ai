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
import { Loader2, Calendar } from 'lucide-react'
import type { Client } from '@/types/database'

function NewAuditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
    title: '',
    client_id: preselectedClientId || '',
  })

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('company_name')

      if (data) {
        const clientsData = data as unknown as Client[]
        setClients(clientsData)

        // Auto-set title if client is preselected
        if (preselectedClientId) {
          const client = clientsData.find((c) => c.id === preselectedClientId)
          if (client) {
            setFormData((prev) => ({
              ...prev,
              title: `${client.company_name} - AI Audit`,
            }))
          }
        }
      }
    }

    fetchClients()
  }, [supabase, preselectedClientId])

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId })

    // Auto-update title
    const client = clients.find((c) => c.id === clientId)
    if (client && !formData.title) {
      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
        title: `${client.company_name} - AI Audit`,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: insertError } = await supabase
        .from('audit_sessions')
        .insert({
          title: formData.title,
          client_id: formData.client_id,
          created_by: user.id,
          status: 'in_progress',
          mode: 'live_capture',
          chat_messages: [],
          structured_data: {},
        } as never)
        .select()
        .single()

      if (insertError) throw insertError

      const sessionData = data as unknown as { id: string }

      // Update client stage if they're a lead
      const client = clients.find((c) => c.id === formData.client_id)
      if (client && client.stage === 'lead') {
        await supabase
          .from('clients')
          .update({ stage: 'audit_scheduled' } as never)
          .eq('id', formData.client_id)

        // Log activity
        await supabase.from('activity_log').insert({
          client_id: formData.client_id,
          user_id: user.id,
          action: 'stage_changed',
          metadata: { from: 'lead', to: 'audit_scheduled' },
        } as never)
      }

      router.push(`/admin/audit/${sessionData.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create audit session')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="New Audit Session" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Start Audit Session
            </CardTitle>
            <CardDescription>
              Begin an AI-assisted audit to discover automation opportunities
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
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Initial Process Discovery"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

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
                  Start Audit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function NewAuditPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewAuditPageContent />
    </Suspense>
  )
}
