'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Kanban,
  ClipboardList,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Pipeline', href: '/admin/pipeline', icon: Kanban },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-border/40 bg-card transition-all duration-200',
        collapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Logo */}
      <div className="flex h-11 items-center justify-between border-b border-border/40 px-3 flex-shrink-0">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
              I
            </div>
            <span className="text-sm font-medium text-foreground">Inerci</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
              I
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              isActive(item.href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Secondary navigation - pinned to bottom */}
      <div className="border-t border-border/40 p-2 flex-shrink-0 mt-auto">
        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              isActive(item.href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 justify-center text-muted-foreground mt-1"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              {!collapsed && <span className="text-xs">Collapse</span>}
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
