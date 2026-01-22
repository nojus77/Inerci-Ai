'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ClientStage } from '@/types/database'

interface AddClientModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const STAGES: { value: ClientStage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'audit_scheduled', label: 'Audit Scheduled' },
  { value: 'audit_done', label: 'Audit Done' },
  { value: 'prototype_building', label: 'Prototype Building' },
  { value: 'prototype_delivered', label: 'Prototype Delivered' },
  { value: 'proposal_draft', label: 'Proposal Draft' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

export function AddClientModal({ open, onClose, onSuccess }: AddClientModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    stage: 'lead' as ClientStage,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('clients').insert({
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone || null,
        stage: formData.stage,
        notes: formData.notes || null,
        tags: [],
      })

      if (error) throw error

      // Reset form
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        stage: 'lead',
        notes: '',
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-xs">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_name" className="text-xs">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage" className="text-xs">Stage</Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => setFormData({ ...formData, stage: value as ClientStage })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value} className="text-sm">
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
