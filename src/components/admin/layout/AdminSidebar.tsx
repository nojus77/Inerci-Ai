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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Pipeline', href: '/admin/pipeline', icon: Kanban },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-52 flex-shrink-0 border-r border-border/40 bg-card">
      {/* Logo */}
      <div className="flex h-11 items-center border-b border-border/40 px-3">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
            I
          </div>
          <span className="text-sm font-medium text-foreground">Inerci</span>
        </Link>
      </div>

      {/* Navigation - all items in one list */}
      <nav className="p-2 space-y-0.5">
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
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
