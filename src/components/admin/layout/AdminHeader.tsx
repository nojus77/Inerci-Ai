'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Plus, LogOut, ClipboardList, Calendar, FileText, TrendingUp, Globe, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AdminThemeToggle } from './AdminThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { QuickActionsModal } from '@/components/admin/shared/QuickActionsModal'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { formatDistanceToNow, isPast, addHours } from 'date-fns'

interface AdminHeaderProps {
  title?: string
  showSearch?: boolean
  showQuickActions?: boolean
}

interface UserInfo {
  email: string
  name: string
  avatarUrl: string | null
  initials: string
}

interface Notification {
  id: string
  type: 'task_due' | 'audit_scheduled' | 'proposal_review' | 'stage_change' | 'new_client'
  title: string
  description: string
  href: string
  createdAt: string
}

const DISMISSED_NOTIFICATIONS_KEY = 'admin_dismissed_notifications'

export function AdminHeader({
  title,
  showSearch = true,
  showQuickActions = true,
}: AdminHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const dismissedIdsRef = useRef<Set<string>>(new Set())

  // Keep ref in sync with state
  useEffect(() => {
    dismissedIdsRef.current = dismissedIds
  }, [dismissedIds])

  // Load dismissed IDs from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Clean up old entries (older than 7 days)
          const now = Date.now()
          const cleanedEntries = Object.entries(parsed).filter(
            ([, timestamp]) => now - (timestamp as number) < 7 * 24 * 60 * 60 * 1000
          )
          const cleanedIds = new Set(cleanedEntries.map(([id]) => id))
          setDismissedIds(cleanedIds)
          dismissedIdsRef.current = cleanedIds
          // Save cleaned version back
          localStorage.setItem(
            DISMISSED_NOTIFICATIONS_KEY,
            JSON.stringify(Object.fromEntries(cleanedEntries))
          )
        } catch {
          setDismissedIds(new Set())
        }
      }
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    const notifs: Notification[] = []

    // Fetch tasks due soon (within 24 hours)
    const { data: dueTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, client:clients(company_name)')
      .eq('status', 'pending')
      .not('due_date', 'is', null)
      .lte('due_date', addHours(new Date(), 24).toISOString())
      .order('due_date', { ascending: true })
      .limit(5)

    if (dueTasks) {
      dueTasks.forEach((task: { id: string; title: string; due_date: string; client: { company_name: string } | null }) => {
        const isOverdue = isPast(new Date(task.due_date))
        notifs.push({
          id: `task-${task.id}`,
          type: 'task_due',
          title: isOverdue ? 'Task overdue' : 'Task due soon',
          description: `${task.title}${task.client ? ` - ${task.client.company_name}` : ''}`,
          href: '/admin/tasks',
          createdAt: task.due_date,
        })
      })
    }

    // Fetch recent activity (last 24 hours)
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('id, action, created_at, metadata, client:clients(id, company_name)')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentActivity) {
      recentActivity.forEach((activity: { id: string; action: string; created_at: string; metadata: Record<string, unknown> | null; client: { id: string; company_name: string } | null }) => {
        let notifType: Notification['type'] = 'stage_change'
        let notifTitle = 'Activity'

        if (activity.action === 'client_created') {
          notifType = 'new_client'
          notifTitle = 'New client added'
        } else if (activity.action === 'stage_changed') {
          notifType = 'stage_change'
          notifTitle = 'Stage updated'
        } else if (activity.action.includes('proposal')) {
          notifType = 'proposal_review'
          notifTitle = 'Proposal update'
        } else if (activity.action.includes('audit')) {
          notifType = 'audit_scheduled'
          notifTitle = 'Audit update'
        }

        notifs.push({
          id: `activity-${activity.id}`,
          type: notifType,
          title: notifTitle,
          description: activity.client?.company_name || 'System',
          href: activity.client ? `/admin/clients/${activity.client.id}` : '/admin',
          createdAt: activity.created_at,
        })
      })
    }

    // Sort by date and take most recent, filter out dismissed
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const filteredNotifs = notifs.filter(n => !dismissedIdsRef.current.has(n.id))
    setNotifications(filteredNotifs.slice(0, 8))
  }, [supabase])

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', authUser.id)
          .single()

        const name = profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        setUser({
          email: authUser.email || '',
          name: name,
          avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
          initials: initials || 'U'
        })
      }
    }
    getUser()
    fetchNotifications()
  }, [supabase, fetchNotifications])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const handleNotificationClick = (href: string) => {
    router.push(href)
  }

  const handleMarkAllRead = () => {
    // Save dismissed notification IDs to localStorage
    if (typeof window !== 'undefined') {
      const now = Date.now()
      const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY)
      const existing = stored ? JSON.parse(stored) : {}

      // Add current notification IDs to dismissed list
      notifications.forEach(n => {
        existing[n.id] = now
      })

      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(existing))
      const newDismissedIds = new Set<string>(Object.keys(existing))
      setDismissedIds(newDismissedIds)
      dismissedIdsRef.current = newDismissedIds
    }
    setNotifications([])
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_due':
        return <ClipboardList className="h-4 w-4 text-amber-500" />
      case 'audit_scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'proposal_review':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'stage_change':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case 'new_client':
        return <Users className="h-4 w-4 text-primary" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card/50 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.header.search}
              className="h-9 w-52 pl-9 text-sm"
            />
          </div>
        )}

        {/* Quick Actions */}
        {showQuickActions && (
          <Button
            size="sm"
            className="h-9 gap-2 px-3 text-sm"
            onClick={() => setQuickActionsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t.header.new}</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <AdminThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
                >
                  {notifications.length > 9 ? '9+' : notifications.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium">{t.header.notifications}</span>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  {t.header.markAllRead}
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[240px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t.header.noNotifications}
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.href)}
                    className="flex items-start gap-3 py-3 cursor-pointer"
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notif.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            {notifications.length > 3 && (
              <div className="text-center py-1 text-xs text-muted-foreground border-t">
                {notifications.length - 3}+ more below
              </div>
            )}
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-center text-sm text-primary cursor-pointer">
                  <Link href="/admin/tasks">
                    {t.header.viewAllNotifications}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 h-9">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.initials || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">{user?.name || 'Loading...'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-sm">
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="font-normal text-muted-foreground text-xs">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-sm">
              <Link href="/admin/settings/users">{t.header.team}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              {t.settings.language}
            </DropdownMenuLabel>
            <div className="flex gap-1 px-2 py-1">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {language === 'en' && <Check className="h-3 w-3" />}
                EN
              </button>
              <button
                onClick={() => setLanguage('lt')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  language === 'lt'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {language === 'lt' && <Check className="h-3 w-3" />}
                LT
              </button>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-destructive cursor-pointer"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {signingOut ? t.header.signingOut : t.header.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      <QuickActionsModal
        open={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
      />
    </header>
  )
}
