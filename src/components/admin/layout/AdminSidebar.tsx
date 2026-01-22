'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  LayoutDashboard,
  Users,
  Kanban,
  ClipboardList,
  Calendar,
  Settings,
  ChevronDown,
  Plug,
  DollarSign,
  Building,
  Users2,
} from 'lucide-react'

const navigationKeys = [
  { key: 'dashboard', href: '/admin', icon: LayoutDashboard },
  { key: 'calendar', href: '/admin/calendar', icon: Calendar },
  { key: 'pipeline', href: '/admin/pipeline', icon: Kanban },
  { key: 'clients', href: '/admin/clients', icon: Users },
  { key: 'tasks', href: '/admin/tasks', icon: ClipboardList },
] as const

const settingsKeys = [
  { key: 'integrations', href: '/admin/settings/integrations', icon: Plug },
  { key: 'pricing', href: '/admin/settings/pricing', icon: DollarSign },
  { key: 'services', href: '/admin/settings/services', icon: Building },
  { key: 'users', href: '/admin/settings/users', icon: Users2 },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { t } = useLanguage()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isSettingsActive = pathname.startsWith('/admin/settings')

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border/40 bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border/40 px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/icon.png"
            alt="Inerci"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-base font-semibold text-foreground">Inerci</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navigationKeys.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{t.nav[item.key]}</span>
          </Link>
        ))}

        {/* Settings Dropdown */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn(
              'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isSettingsActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span>{t.nav.settings}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                settingsOpen && 'rotate-180'
              )}
            />
          </button>
          {settingsOpen && (
            <div className="mt-1 ml-4 pl-4 border-l border-border/40 space-y-1">
              {settingsKeys.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-muted/70 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{t.nav[item.key]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
