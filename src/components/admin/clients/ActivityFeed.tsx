'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityLog } from '@/types/database'
import {
  User,
  FileText,
  TrendingUp,
  Mail,
  CheckCircle,
  PlusCircle,
  Edit,
} from 'lucide-react'

interface ActivityFeedProps {
  clientId: string
}

const ACTION_ICONS: Record<string, typeof User> = {
  created: PlusCircle,
  updated: Edit,
  stage_changed: TrendingUp,
  proposal_sent: Mail,
  note_added: FileText,
  task_completed: CheckCircle,
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Client created',
  updated: 'Client updated',
  stage_changed: 'Stage changed',
  proposal_sent: 'Proposal sent',
  note_added: 'Note added',
  task_completed: 'Task completed',
}

export function ActivityFeed({ clientId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<(ActivityLog & { user?: { name: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, user:users(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching activities:', error)
      } else {
        setActivities((data || []) as unknown as (ActivityLog & { user?: { name: string } })[])
      }
      setLoading(false)
    }

    fetchActivities()
  }, [clientId, supabase])

  if (loading) {
    return <p className="text-muted-foreground">Loading activity...</p>
  }

  if (activities.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No activity recorded yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = ACTION_ICONS[activity.action] || User
        const label = ACTION_LABELS[activity.action] || activity.action

        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user?.name || 'System'}</span>
                {' '}
                <span className="text-muted-foreground">{label}</span>
              </p>
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.action === 'stage_changed' && (activity.metadata as Record<string, string>).from && (
                    <>From {String((activity.metadata as Record<string, string>).from)} to {String((activity.metadata as Record<string, string>).to)}</>
                  )}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
