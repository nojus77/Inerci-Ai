import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Plug, DollarSign, Users, Building } from 'lucide-react'
import Link from 'next/link'

const settingsPages = [
  {
    title: 'Integrations',
    description: 'Configure Slack webhooks and Cal.com',
    href: '/admin/settings/integrations',
    icon: Plug,
  },
  {
    title: 'Pricing',
    description: 'Set up pricing formulas and rates',
    href: '/admin/settings/pricing',
    icon: DollarSign,
  },
  {
    title: 'Services',
    description: 'Manage service catalog',
    href: '/admin/settings/services',
    icon: Building,
  },
  {
    title: 'Users',
    description: 'Manage team members and roles',
    href: '/admin/settings/users',
    icon: Users,
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Settings" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Settings
            </h2>
            <p className="text-muted-foreground mt-1">
              Configure your Inerci Admin workspace
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {settingsPages.map((page) => (
              <Link key={page.href} href={page.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <page.icon className="h-5 w-5 text-primary" />
                      {page.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{page.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
