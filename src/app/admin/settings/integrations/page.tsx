'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Slack, Calendar, CheckCircle } from 'lucide-react'

interface SlackConfig {
  webhook_url: string
  enabled_events: string[]
}

interface CalConfig {
  embed_link: string
  webhook_secret: string
  api_key: string
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [slackConfig, setSlackConfig] = useState<SlackConfig>({
    webhook_url: '',
    enabled_events: ['proposal_sent', 'stage_changed'],
  })

  const [calConfig, setCalConfig] = useState<CalConfig>({
    embed_link: '',
    webhook_secret: '',
    api_key: '',
  })

  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['slack_config', 'cal_config'])

      if (settingsData) {
        const settings = settingsData as unknown as { key: string; value: unknown }[]
        settings.forEach((setting) => {
          if (setting.key === 'slack_config') {
            setSlackConfig(setting.value as SlackConfig)
          } else if (setting.key === 'cal_config') {
            setCalConfig(setting.value as CalConfig)
          }
        })
      }
      setLoading(false)
    }

    fetchSettings()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    await Promise.all([
      supabase.from('settings').upsert({ key: 'slack_config', value: slackConfig } as never),
      supabase.from('settings').upsert({ key: 'cal_config', value: calConfig } as never),
    ])

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const toggleEvent = (event: string) => {
    setSlackConfig((prev) => ({
      ...prev,
      enabled_events: prev.enabled_events.includes(event)
        ? prev.enabled_events.filter((e) => e !== event)
        : [...prev.enabled_events, event],
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Integrations" showSearch={false} showQuickActions={false} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Integrations" showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-6">
          {success && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Slack Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Slack className="h-5 w-5" />
                Slack Integration
              </CardTitle>
              <CardDescription>
                Send notifications to Slack when important events occur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slack_webhook">Webhook URL</Label>
                <Input
                  id="slack_webhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackConfig.webhook_url}
                  onChange={(e) =>
                    setSlackConfig({ ...slackConfig, webhook_url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>Enabled Events</Label>
                <div className="space-y-2">
                  {[
                    { id: 'proposal_sent', label: 'Proposal sent to client' },
                    { id: 'stage_changed', label: 'Client stage changed' },
                    { id: 'audit_completed', label: 'Audit completed' },
                    { id: 'task_due', label: 'Task due reminder' },
                  ].map((event) => (
                    <div key={event.id} className="flex items-center justify-between">
                      <span className="text-sm">{event.label}</span>
                      <Switch
                        checked={slackConfig.enabled_events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cal.com Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cal.com Integration
              </CardTitle>
              <CardDescription>
                Configure Cal.com for booking audit sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cal_embed">Embed Link</Label>
                <Input
                  id="cal_embed"
                  placeholder="your-team/audit-call"
                  value={calConfig.embed_link}
                  onChange={(e) =>
                    setCalConfig({ ...calConfig, embed_link: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The Cal.com link to embed for booking (without https://cal.com/)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cal_secret">Webhook Secret</Label>
                <Input
                  id="cal_secret"
                  type="password"
                  placeholder="Your webhook signing secret"
                  value={calConfig.webhook_secret}
                  onChange={(e) =>
                    setCalConfig({ ...calConfig, webhook_secret: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Used to verify incoming webhooks from Cal.com
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cal_api_key">API Key</Label>
                <Input
                  id="cal_api_key"
                  type="password"
                  placeholder="cal_live_..."
                  value={calConfig.api_key}
                  onChange={(e) =>
                    setCalConfig({ ...calConfig, api_key: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Required to sync existing bookings. Get it from Cal.com Settings → Developer → API Keys
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
