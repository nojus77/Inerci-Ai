'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { FileText, Building, Globe } from 'lucide-react'
import type { ProposalLanguage } from '@/types/database'

interface AddProposalModalProps {
  open: boolean
  onClose: () => void
  defaultClientId?: string
  onSuccess?: () => void
}

interface Client {
  id: string
  company_name: string
}

export function AddProposalModal({ open, onClose, defaultClientId, onSuccess }: AddProposalModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: '',
    client_id: defaultClientId || '',
    language: 'en' as ProposalLanguage,
  })

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name')

    if (data) {
      setClients(data)
    }
  }, [supabase])

  useEffect(() => {
    if (open) {
      fetchClients()
      // Reset form when opening
      setFormData({
        title: '',
        client_id: defaultClientId || '',
        language: 'en',
      })
    }
  }, [open, defaultClientId, fetchClients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Client is required for proposals
      if (!formData.client_id) {
        alert('Please select a client for this proposal')
        setLoading(false)
        return
      }

      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert({
          title: formData.title,
          client_id: formData.client_id,
          language: formData.language,
          status: 'draft',
          created_by: user.id,
        })
        .select('id')
        .single()

      if (error) throw error

      onSuccess?.()
      onClose()

      // Navigate to the proposal editor
      if (proposal && proposal.id) {
        router.push(`/admin/proposals/${proposal.id}`)
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      client_id: defaultClientId || '',
      language: 'en',
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Proposal
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Start a new proposal for a client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Proposal Title *
            </Label>
            <Input
              id="title"
              placeholder="AI Automation Proposal"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium">
              Client *
            </Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a client" />
                </div>
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

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium">
              Language
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value as ProposalLanguage })}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="lt">Lithuanian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.client_id}>
              {loading ? 'Creating...' : 'Create & Edit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
