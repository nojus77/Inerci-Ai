'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building, User, Mail, Phone, Tag, FileText } from 'lucide-react'
import type { ClientStage } from '@/types/database'

interface AddClientModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const STAGES: { value: ClientStage; label: string; color: string }[] = [
  { value: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { value: 'audit_scheduled', label: 'Audit Scheduled', color: 'bg-blue-500' },
  { value: 'audit_done', label: 'Audit Done', color: 'bg-indigo-500' },
  { value: 'prototype_building', label: 'Prototype Building', color: 'bg-purple-500' },
  { value: 'prototype_delivered', label: 'Prototype Delivered', color: 'bg-violet-500' },
  { value: 'proposal_draft', label: 'Proposal Draft', color: 'bg-amber-500' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-yellow-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { value: 'won', label: 'Won', color: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-500' },
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
    tags: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Parse tags from comma-separated string
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // Format phone number with +370 prefix if provided
      const phoneNumber = formData.phone ? `+370${formData.phone}` : null

      const { error } = await supabase.from('clients').insert({
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: phoneNumber,
        stage: formData.stage,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        notes: formData.notes || null,
      })

      if (error) throw error

      // Reset form
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        stage: 'lead',
        tags: '',
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

  const handleClose = () => {
    // Reset form on close
    setFormData({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      stage: 'lead',
      tags: '',
      notes: '',
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Create Client</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a new client to your CRM
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Company Name & Contact Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium">
                Company Name *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="company_name"
                  placeholder="Acme Corp"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-sm font-medium">
                Contact Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact_name"
                  placeholder="John Doe"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@acme.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone
              </Label>
              <div className="flex">
                <div className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                  +370
                </div>
                <Input
                  id="phone"
                  placeholder="600 00000"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow digits, max 8 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setFormData({ ...formData, phone: value })
                  }}
                  maxLength={8}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter 8 digits after +370
              </p>
            </div>
          </div>

          {/* Stage & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-sm font-medium">
                Stage
              </Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value as ClientStage })}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${STAGES.find(s => s.value === formData.stage)?.color}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                        {stage.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="tags"
                  placeholder="e-commerce, saas, enterprise"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Comma-separated list of tags
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="notes"
                placeholder="Any additional notes about this client..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="pl-10 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
