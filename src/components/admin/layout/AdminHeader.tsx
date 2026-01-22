'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Plus, LogOut, Users, ClipboardList } from 'lucide-react'
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
import { AddClientModal } from '@/components/admin/shared/AddClientModal'
import { AddTaskModal } from '@/components/admin/shared/AddTaskModal'

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

export function AdminHeader({
  title,
  showSearch = true,
  showQuickActions = true,
}: AdminHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        // Try to get user profile from users table
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
  }, [supabase])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
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
              placeholder="Search..."
              className="h-9 w-52 pl-9 text-sm"
            />
          </div>
        )}

        {/* Quick Actions */}
        {showQuickActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 gap-2 px-3 text-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-sm">Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowAddClient(true)}
                className="text-sm cursor-pointer"
              >
                <Users className="h-4 w-4 mr-2" />
                New Client
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowAddTask(true)}
                className="text-sm cursor-pointer"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                New Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Theme Toggle */}
        <AdminThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="text-sm">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
                <span className="text-sm font-medium">New audit scheduled</span>
                <span className="text-xs text-muted-foreground">
                  TechCorp Ltd - Tomorrow at 2:00 PM
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
                <span className="text-sm font-medium">Proposal review requested</span>
                <span className="text-xs text-muted-foreground">
                  Innovation Labs - Awaiting approval
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
                <span className="text-sm font-medium">Task due soon</span>
                <span className="text-xs text-muted-foreground">
                  Follow up with StartupXYZ - Due in 2 hours
                </span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              View all notifications
            </DropdownMenuItem>
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
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-sm">
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="font-normal text-muted-foreground text-xs">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-sm">
              <Link href="/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-sm">
              <Link href="/admin/settings/users">Team</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-destructive cursor-pointer"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
      />
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
      />
    </header>
  )
}
