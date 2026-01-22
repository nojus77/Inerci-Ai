'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'

interface Activity {
  id: string
  action: string
  created_at: string
  metadata?: Record<string, unknown>
  client?: { id: string; company_name: string } | null
  user?: { name: string; email: string } | null
}

interface ActivityPreviewModalProps {
  open: boolean
  onClose: () => void
  activity: Activity | null
}

export function ActivityPreviewModal({ open, onClose, activity }: ActivityPreviewModalProps) {
  if (!activity) return null

  const getActivityColor = (action: string): string => {
    if (action.includes('created')) return 'bg-emerald-500'
    if (action.includes('stage')) return 'bg-amber-500'
    if (action.includes('proposal')) return 'bg-primary'
    if (action.includes('task')) return 'bg-blue-500'
    if (action.includes('updated')) return 'bg-orange-500'
    return 'bg-muted-foreground'
  }

  const formatActionName = (action: string): string => {
    return action.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getActivityColor(activity.action)}`} />
            Activity Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Action</p>
            <Badge variant="secondary" className="text-xs">
              {formatActionName(activity.action)}
            </Badge>
          </div>

          {activity.client && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Client</p>
              <Link
                href={`/admin/clients/${activity.client.id}`}
                className="text-sm font-medium text-primary hover:underline"
                onClick={onClose}
              >
                {activity.client.company_name}
              </Link>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">When</p>
            <p className="text-sm">
              {format(new Date(activity.created_at), 'PPp')}
              <span className="text-muted-foreground ml-1">
                ({formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })})
              </span>
            </p>
          </div>

          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Details</p>
              <div className="bg-muted/50 rounded-md p-2 text-xs space-y-1">
                {Object.entries(activity.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
