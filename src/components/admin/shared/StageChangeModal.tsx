'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ClientStage } from '@/types/database'
import type { Tables } from '@/lib/supabase/types'

type ClientRow = Tables<'clients'>

interface StageChangeModalProps {
  open: boolean
  onClose: () => void
  client: ClientRow | null
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

// Stages that require a reason when transitioning to them
const REASON_REQUIRED_STAGES: ClientStage[] = ['lost', 'on_hold']

// Define the "normal" progression order
const STAGE_ORDER: ClientStage[] = [
  'lead',
  'audit_scheduled',
  'audit_done',
  'prototype_building',
  'prototype_delivered',
  'proposal_draft',
  'proposal_sent',
  'negotiation',
  'won',
]

export function StageChangeModal({ open, onClose, client, onSuccess }: StageChangeModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedStage, setSelectedStage] = useState<ClientStage | null>(null)
  const [reason, setReason] = useState('')
  const [showReasonField, setShowReasonField] = useState(false)

  useEffect(() => {
    if (open && client) {
      setSelectedStage(null)
      setReason('')
      setShowReasonField(false)
    }
  }, [open, client])

  if (!client) return null

  const currentStage = client.stage
  const currentStageInfo = STAGES.find(s => s.value === currentStage)
  const currentIndex = STAGE_ORDER.indexOf(currentStage)

  const handleStageSelect = (stage: ClientStage) => {
    setSelectedStage(stage)

    // Check if reason is required
    const needsReason = REASON_REQUIRED_STAGES.includes(stage)
    const selectedIndex = STAGE_ORDER.indexOf(stage)
    const isSkippingStages = selectedIndex > currentIndex + 1 && currentIndex !== -1 && selectedIndex !== -1
    const isMovingBackward = selectedIndex < currentIndex && selectedIndex !== -1 && currentIndex !== -1

    setShowReasonField(needsReason || isSkippingStages || isMovingBackward)
    if (!needsReason && !isSkippingStages && !isMovingBackward) {
      setReason('')
    }
  }

  const handleSubmit = async () => {
    if (!selectedStage || selectedStage === currentStage) return

    // Validate reason if required
    if (showReasonField && !reason.trim()) {
      return // Don't submit without reason when required
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Update client stage
      const { error } = await supabase
        .from('clients')
        .update({ stage: selectedStage })
        .eq('id', client.id)

      if (error) throw error

      // Log activity
      if (user) {
        await supabase.from('activity_log').insert({
          client_id: client.id,
          user_id: user.id,
          action: 'stage_changed',
          metadata: {
            from_stage: currentStage,
            to_stage: selectedStage,
            reason: reason || null,
          },
        } as never)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating stage:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageChangeType = (toStage: ClientStage): 'progress' | 'regress' | 'terminal' | 'neutral' => {
    if (toStage === 'won') return 'progress'
    if (toStage === 'lost' || toStage === 'on_hold') return 'terminal'

    const toIndex = STAGE_ORDER.indexOf(toStage)
    if (toIndex === -1) return 'neutral'
    if (toIndex > currentIndex) return 'progress'
    if (toIndex < currentIndex) return 'regress'
    return 'neutral'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Change Stage</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the pipeline stage for {client.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Current Stage */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Current:</span>
            {currentStageInfo && (
              <Badge className={`${currentStageInfo.color} text-white`}>
                {currentStageInfo.label}
              </Badge>
            )}
            {selectedStage && selectedStage !== currentStage && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge className={`${STAGES.find(s => s.value === selectedStage)?.color} text-white`}>
                  {STAGES.find(s => s.value === selectedStage)?.label}
                </Badge>
              </>
            )}
          </div>

          {/* Stage Selection Grid */}
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((stage) => {
              const isSelected = selectedStage === stage.value
              const isCurrent = currentStage === stage.value
              const changeType = getStageChangeType(stage.value)

              return (
                <button
                  key={stage.value}
                  onClick={() => !isCurrent && handleStageSelect(stage.value)}
                  disabled={isCurrent}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border text-left transition-all
                    ${isCurrent
                      ? 'border-primary bg-primary/5 cursor-not-allowed opacity-50'
                      : isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stage.label}</p>
                    {isCurrent && (
                      <p className="text-xs text-muted-foreground">Current</p>
                    )}
                  </div>
                  {isSelected && changeType === 'terminal' && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {isSelected && changeType === 'progress' && stage.value === 'won' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Reason Field */}
          {showReasonField && (
            <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <Label className="text-sm font-medium">
                  Reason required
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {REASON_REQUIRED_STAGES.includes(selectedStage!)
                  ? `Please explain why this client is being moved to "${STAGES.find(s => s.value === selectedStage)?.label}".`
                  : 'You are skipping stages or moving backward. Please explain why.'}
              </p>
              <Textarea
                placeholder="Enter the reason for this change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedStage || selectedStage === currentStage || (showReasonField && !reason.trim())}
            >
              {loading ? 'Updating...' : 'Update Stage'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
