'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Shield, CheckCircle2, AlertCircle, Copy, User, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { UserRole } from '@/types/database'

interface InviteUserModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface InviteResult {
  tempPassword: string
  loginUrl: string
}

export function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'sales' as UserRole,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setInviteResult(null)

    try {
      const response = await fetch('/admin/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || formData.email.split('@')[0],
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setInviteResult({
        tempPassword: data.tempPassword,
        loginUrl: data.loginUrl,
      })
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      console.error('Error inviting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!inviteResult) return
    const text = `Login URL: ${inviteResult.loginUrl}\nEmail: ${formData.email}\nTemporary Password: ${inviteResult.tempPassword}\n\nPlease change your password after first login.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setFormData({ email: '', name: '', role: 'sales' })
    setError(null)
    setSuccess(false)
    setInviteResult(null)
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t.users.inviteTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t.users.inviteDescription}
          </DialogDescription>
        </DialogHeader>

        {success && inviteResult ? (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-emerald-600">User Created Successfully</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Login URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-background px-2 py-1 rounded border flex-1 truncate">
                    {inviteResult.loginUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => window.open(inviteResult.loginUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                <code className="text-sm bg-background px-2 py-1 rounded border block">
                  {formData.email}
                </code>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Temporary Password</p>
                <code className="text-sm bg-background px-2 py-1 rounded border block font-mono">
                  {inviteResult.tempPassword}
                </code>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Share these credentials securely. User should change password after first login.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyCredentials}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t.users.inviteEmail} *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t.users.inviteEmailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                {t.users.inviteRole}
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t.users.admin}</SelectItem>
                    <SelectItem value="sales">{t.users.sales}</SelectItem>
                    <SelectItem value="marketing">{t.users.marketing}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t.modals.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t.users.sending : t.users.sendInvite}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
