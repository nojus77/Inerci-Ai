'use client'

import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useTheme } from '@/components/admin/layout/AdminThemeToggle'

export default function SettingsPage() {
  const { t } = useLanguage()
  const { isDark, toggle } = useTheme()

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title={t.settings.title} showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md">
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
    </div>
  )
}
