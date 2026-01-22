'use client'

import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Plug, DollarSign, Users, Building, Globe, Moon, Sun, Check } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useTheme } from '@/components/admin/layout/AdminThemeToggle'

const settingsPages = [
  {
    title: 'Integrations',
    titleLt: 'Integracijos',
    description: 'Configure Slack webhooks and Cal.com',
    descriptionLt: 'Konfigūruoti Slack ir Cal.com',
    href: '/admin/settings/integrations',
    icon: Plug,
  },
  {
    title: 'Pricing',
    titleLt: 'Kainos',
    description: 'Set up pricing formulas and rates',
    descriptionLt: 'Nustatyti kainų formules ir tarifus',
    href: '/admin/settings/pricing',
    icon: DollarSign,
  },
  {
    title: 'Services',
    titleLt: 'Paslaugos',
    description: 'Manage service catalog',
    descriptionLt: 'Tvarkyti paslaugų katalogą',
    href: '/admin/settings/services',
    icon: Building,
  },
  {
    title: 'Users',
    titleLt: 'Vartotojai',
    description: 'Manage team members and roles',
    descriptionLt: 'Tvarkyti komandos narius ir roles',
    href: '/admin/settings/users',
    icon: Users,
  },
]

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const { isDark, toggle } = useTheme()

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title={t.settings.title} showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl space-y-8">
          {/* General Settings */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t.settings.general}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Language Setting */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-5 w-5 text-primary" />
                    {t.settings.language}
                  </CardTitle>
                  <CardDescription>{t.settings.languageDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={language === 'en' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLanguage('en')}
                      className="flex-1"
                    >
                      {language === 'en' && <Check className="h-4 w-4 mr-1.5" />}
                      {t.settings.english}
                    </Button>
                    <Button
                      variant={language === 'lt' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLanguage('lt')}
                      className="flex-1"
                    >
                      {language === 'lt' && <Check className="h-4 w-4 mr-1.5" />}
                      {t.settings.lithuanian}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Setting */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                    {t.settings.theme}
                  </CardTitle>
                  <CardDescription>{t.settings.themeDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={!isDark ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => isDark && toggle()}
                      className="flex-1"
                    >
                      {!isDark && <Check className="h-4 w-4 mr-1.5" />}
                      <Sun className="h-4 w-4 mr-1.5" />
                      {t.settings.lightMode}
                    </Button>
                    <Button
                      variant={isDark ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => !isDark && toggle()}
                      className="flex-1"
                    >
                      {isDark && <Check className="h-4 w-4 mr-1.5" />}
                      <Moon className="h-4 w-4 mr-1.5" />
                      {t.settings.darkMode}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Other Settings Pages */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                {language === 'lt' ? 'Kiti nustatymai' : 'Other Settings'}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {settingsPages.map((page) => (
                <Link key={page.href} href={page.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <page.icon className="h-5 w-5 text-primary" />
                        {language === 'lt' ? page.titleLt : page.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {language === 'lt' ? page.descriptionLt : page.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
