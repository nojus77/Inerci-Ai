'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, Building } from 'lucide-react'
import type { Client } from '@/types/database'

interface StartAuditModalProps {
  open: boolean
  onClose: () => void
  defaultClientId?: string
  onSuccess?: () => void
}

export function StartAuditModal({ open, onClose, defaultClientId, onSuccess }: StartAuditModalProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: '',
    client_id: defaultClientId || '_none',
  })

  useEffect(() => {
    if (open) {
      fetchClients()
      if (defaultClientId) {
        setFormData(prev => ({ ...prev, client_id: defaultClientId }))
      }
    }
  }, [open, defaultClientId])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('company_name')

    if (data) {
      const clientsData = data as unknown as Client[]
      setClients(clientsData)

      // Auto-set title if client is preselected
      if (defaultClientId) {
        const client = clientsData.find((c) => c.id === defaultClientId)
        if (client) {
          setFormData((prev) => ({
            ...prev,
            title: `${client.company_name} - AI Audit`,
          }))
        }
      }
    }
  }

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId })

    // Auto-update title
    if (clientId !== '_none') {
      const client = clients.find((c) => c.id === clientId)
      if (client && !formData.title) {
        setFormData((prev) => ({
          ...prev,
          client_id: clientId,
          title: `${client.company_name} - AI Audit`,
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.client_id === '_none') {
      setError(t.modals.selectClient)
      return
    }

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

      onSuccess?.()
      handleClose()
      router.push(`/admin/audit/${sessionData.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create audit session')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      client_id: defaultClientId || '_none',
    })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.audit.startAudit}
          </DialogTitle>
          <DialogDescription>
            {t.audit.startAuditDescription || 'Begin an AI-assisted audit to discover automation opportunities'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t.modals.linkedClient} *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Select
                value={formData.client_id}
                onValueChange={handleClientChange}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder={t.modals.selectClient} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t.modals.selectClient}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">{t.audit.sessionTitle}</Label>
            <Input
              id="title"
              placeholder={t.audit.sessionTitlePlaceholder}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t.modals.cancel}
            </Button>
            <Button type="submit" disabled={loading || formData.client_id === '_none'}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.audit.startAudit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
