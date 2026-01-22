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
    <aside className="w-56 flex-shrink-0 border-r border-border/40 bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border/40 px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            I
          </div>
          <span className="text-base font-semibold text-foreground">Inerci</span>
        </Link>
      </div>

      {/* Navigation - all items in one list */}
      <nav className="p-3 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
