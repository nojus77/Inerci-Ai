'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Mail,
  Calendar,
  CheckCircle2,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Key,
  Copy,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { User, UserRole } from '@/types/database'

interface TeamMemberPreviewModalProps {
  open: boolean
  onClose: () => void
  user: User | null
}

interface ActivityStats {
  clientsCreated: number
  tasksCompleted: number
  proposalsSent: number
  auditsCompleted: number
  stageChanges: number
}

interface RecentActivity {
  id: string
  action: string
  created_at: string
  metadata: Record<string, unknown> | null
  client?: { company_name: string } | null
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-amber-500',
  sales: 'bg-emerald-500',
  marketing: 'bg-violet-500',
}

const ROLE_BG: Record<UserRole, string> = {
  admin: 'bg-amber-50 border-amber-200',
  sales: 'bg-emerald-50 border-emerald-200',
  marketing: 'bg-violet-50 border-violet-200',
}

export function TeamMemberPreviewModal({ open, onClose, user }: TeamMemberPreviewModalProps) {
  const { t } = useLanguage()
  const supabase = createClient()
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const fetchUserStats = useCallback(async () => {
    if (!user) return

    setLoading(true)

    try {
      // Fetch activity log for this user
      const { data: activities } = await supabase
        .from('activity_log')
        .select('action')
        .eq('user_id', user.id)

      const activityList = activities || []

      // Calculate stats based on activity_action enum values
      const stats: ActivityStats = {
        clientsCreated: activityList.filter(a => a.action === 'created').length,
        tasksCompleted: activityList.filter(a => a.action === 'task_completed').length,
        proposalsSent: activityList.filter(a => a.action === 'proposal_sent').length,
        auditsCompleted: activityList.filter(a => a.action === 'note_added').length, // Using notes as audit activity proxy
        stageChanges: activityList.filter(a => a.action === 'stage_changed').length,
      }

      setStats(stats)

      // Fetch recent activity
      const { data: recent } = await supabase
        .from('activity_log')
        .select('id, action, created_at, metadata, client:clients(company_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recent) {
        setRecentActivity(recent as unknown as RecentActivity[])
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (open && user) {
      fetchUserStats()
      // Reset password state when modal opens
      setNewPassword(null)
      setResetError(null)
      setPasswordCopied(false)
    }
  }, [open, user, fetchUserStats])

  const handleResetPassword = async () => {
    if (!user) return

    setResettingPassword(true)
    setResetError(null)
    setNewPassword(null)

    try {
      const response = await fetch('/admin/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setNewPassword(data.newPassword)
    } catch (err) {
      console.error('Error resetting password:', err)
      setResetError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleCopyPassword = () => {
    if (!newPassword || !user) return
    const loginUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/admin/login`
      : ''
    const text = `Login URL: ${loginUrl}\nEmail: ${user.email}\nNew Password: ${newPassword}\n\nPlease change your password after logging in.`
    navigator.clipboard.writeText(text)
    setPasswordCopied(true)
    setTimeout(() => setPasswordCopied(false), 2000)
  }

  if (!user) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return t.users.admin
      case 'sales': return t.users.sales
      case 'marketing': return t.users.marketing
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const statsConfig = [
    { label: t.clients.title, value: stats?.clientsCreated ?? 0, icon: Users, color: 'text-blue-500' },
    { label: t.tasks.completed, value: stats?.tasksCompleted ?? 0, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: t.common.proposals, value: stats?.proposalsSent ?? 0, icon: FileText, color: 'text-purple-500' },
    { label: 'Stage Changes', value: stats?.stageChanges ?? 0, icon: TrendingUp, color: 'text-amber-500' },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Team Member Profile</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className={`-mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b ${ROLE_BG[user.role]}`}>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className={`${ROLE_COLORS[user.role]} text-white text-lg`}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${ROLE_COLORS[user.role]} text-white`}>
                  {getRoleLabel(user.role)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t.users.joined} {format(new Date(user.created_at), 'MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Password Reset Section */}
        <div className="py-3 border-b">
          {newPassword ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Password Reset Successfully
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">New Password</p>
                  <code className="text-sm bg-background px-2 py-1 rounded border block font-mono">
                    {newPassword}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={handleCopyPassword}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  {passwordCopied ? 'Copied!' : 'Copy Credentials'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Share these credentials securely with the user
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>Need to reset password?</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleResetPassword}
                disabled={resettingPassword}
              >
                {resettingPassword ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          )}
          {resetError && (
            <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {resetError}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-4">
          {statsConfig.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </h4>
          {loading ? (
            <p className="text-sm text-muted-foreground py-2">Loading...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t.common.noActivity}</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{formatAction(activity.action)}</span>
                    {activity.client && (
                      <span className="text-muted-foreground"> - {activity.client.company_name}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
