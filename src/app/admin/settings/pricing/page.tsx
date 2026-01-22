'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, DollarSign, CheckCircle } from 'lucide-react'

interface PricingConfig {
  base_rate: number
  complexity_multipliers: {
    low: number
    medium: number
    high: number
  }
  integration_cost: number
}

export default function PricingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [config, setConfig] = useState<PricingConfig>({
    base_rate: 150,
    complexity_multipliers: {
      low: 1,
      medium: 1.5,
      high: 2,
    },
    integration_cost: 500,
  })

  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'pricing_config')
        .single()

      if (data) {
        const settingData = data as unknown as { value: PricingConfig }
        setConfig(settingData.value)
      }
      setLoading(false)
    }

    fetchSettings()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    await supabase
      .from('settings')
      .upsert({ key: 'pricing_config', value: config } as never)

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  // Calculate example
  const exampleHours = 40
  const exampleTotal =
    exampleHours * config.base_rate * config.complexity_multipliers.medium +
    config.integration_cost

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Pricing Settings" showSearch={false} showQuickActions={false} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Pricing Settings" showSearch={false} showQuickActions={false} />

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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Formula
              </CardTitle>
              <CardDescription>
                Configure the base rates and multipliers for proposals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="base_rate">Base Hourly Rate (EUR)</Label>
                <Input
                  id="base_rate"
                  type="number"
                  value={config.base_rate}
                  onChange={(e) =>
                    setConfig({ ...config, base_rate: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>Complexity Multipliers</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="mult_low" className="text-sm text-muted-foreground">
                      Low
                    </Label>
                    <Input
                      id="mult_low"
                      type="number"
                      step="0.1"
                      value={config.complexity_multipliers.low}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          complexity_multipliers: {
                            ...config.complexity_multipliers,
                            low: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mult_med" className="text-sm text-muted-foreground">
                      Medium
                    </Label>
                    <Input
                      id="mult_med"
                      type="number"
                      step="0.1"
                      value={config.complexity_multipliers.medium}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          complexity_multipliers: {
                            ...config.complexity_multipliers,
                            medium: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mult_high" className="text-sm text-muted-foreground">
                      High
                    </Label>
                    <Input
                      id="mult_high"
                      type="number"
                      step="0.1"
                      value={config.complexity_multipliers.high}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          complexity_multipliers: {
                            ...config.complexity_multipliers,
                            high: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="integration_cost">Base Integration Cost (EUR)</Label>
                <Input
                  id="integration_cost"
                  type="number"
                  value={config.integration_cost}
                  onChange={(e) =>
                    setConfig({ ...config, integration_cost: Number(e.target.value) })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Formula Preview */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Formula Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <code className="block p-3 bg-background rounded text-sm">
                Total = (Hours x Base Rate x Complexity) + Integration Cost
              </code>

              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Example:</strong> {exampleHours} hours at medium complexity
                </p>
                <p className="mt-1">
                  = ({exampleHours} x {config.base_rate} x{' '}
                  {config.complexity_multipliers.medium}) + {config.integration_cost}
                </p>
                <p className="mt-1 text-foreground font-semibold">
                  = {exampleTotal.toLocaleString()} EUR
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
