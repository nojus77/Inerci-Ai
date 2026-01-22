'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import type { Client, ClientStage } from '@/types/database'

const STAGE_LABELS: Record<ClientStage, string> = {
  lead: 'Lead',
  audit_scheduled: 'Audit Scheduled',
  audit_done: 'Audit Done',
  prototype_building: 'Prototype Building',
  prototype_delivered: 'Prototype Delivered',
  proposal_draft: 'Proposal Draft',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  on_hold: 'On Hold',
}

interface StageChangeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  client?: Client
  fromStage?: ClientStage
  toStage?: ClientStage
}

export function StageChangeModal({
  open,
  onClose,
  onConfirm,
  client,
  fromStage,
  toStage,
}: StageChangeModalProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim())
      setReason('')
    }
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Non-Sequential Stage Change
          </DialogTitle>
          <DialogDescription>
            You&apos;re moving <strong>{client?.company_name}</strong> from{' '}
            <strong>{fromStage && STAGE_LABELS[fromStage]}</strong> to{' '}
            <strong>{toStage && STAGE_LABELS[toStage]}</strong>.
            <br />
            This skips one or more stages in the normal flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Please provide a reason for this override *
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Client requested to skip prototype phase and go directly to proposal..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim()}>
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
