'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, Shield, UserPlus, Lock, Clock, RefreshCw, X, Mail } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions'
import { InviteUserModal } from '@/components/admin/shared/InviteUserModal'
import { TeamMemberPreviewModal } from '@/components/admin/shared/TeamMemberPreviewModal'
import type { User, UserRole } from '@/types/database'

interface PendingInvitation {
  id: string
  email: string
  role: UserRole
  invited_by: string | null
  created_at: string
  expires_at: string
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-amber-500',
  sales: 'bg-emerald-500',
  marketing: 'bg-violet-500',
}

export default function UsersSettingsPage() {
  const { t } = useLanguage()
  const { canManageUsers, loading: permissionsLoading } = usePermissions()
  const [users, setUsers] = useState<User[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const supabase = createClient()

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (data) {
      setUsers(data as unknown as User[])
    }
    setLoading(false)
  }

  const fetchPendingInvitations = async () => {
    const { data } = await supabase
      .from('pending_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setPendingInvitations(data as unknown as PendingInvitation[])
    }
  }

  const handleResendInvite = async (invitation: PendingInvitation) => {
    try {
      // Send magic link again
      const { error } = await supabase.auth.signInWithOtp({
        email: invitation.email,
        options: {
          data: {
            role: invitation.role,
            invited: true,
          },
          emailRedirectTo: `${window.location.origin}/admin/callback`,
        },
      })

      if (error) throw error

      // Update expiration date
      await supabase
        .from('pending_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        } as never)
        .eq('id', invitation.id)

      fetchPendingInvitations()
    } catch (err) {
      console.error('Error resending invitation:', err)
    }
  }

  const handleCancelInvite = async (invitation: PendingInvitation) => {
    try {
      await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitation.id)

      fetchPendingInvitations()
    } catch (err) {
      console.error('Error canceling invitation:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchPendingInvitations()
  }, [supabase])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!canManageUsers) return

    const { error } = await supabase
      .from('users')
      .update({ role: newRole } as never)
      .eq('id', userId)

    if (!error) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      )
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return t.users.admin
      case 'sales': return t.users.sales
      case 'marketing': return t.users.marketing
    }
  }

  if (loading || permissionsLoading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title={t.users.title} showSearch={false} showQuickActions={false} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title={t.users.title} showSearch={false} showQuickActions={false} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl space-y-6">
          {/* Permission Warning for non-admins */}
          {!canManageUsers && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3 text-amber-800">
                  <Lock className="h-5 w-5" />
                  <p className="text-sm">You don&apos;t have permission to manage users. Contact an admin for access.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                {t.users.rolePermissions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Badge className={`${ROLE_COLORS.admin} text-white`}>{t.users.admin}</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(t.users.adminPerms as unknown as string[]).map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <Badge className={`${ROLE_COLORS.sales} text-white`}>{t.users.sales}</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(t.users.salesPerms as unknown as string[]).map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <Badge className={`${ROLE_COLORS.marketing} text-white`}>{t.users.marketing}</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(t.users.marketingPerms as unknown as string[]).map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5" />
                  {t.users.pendingInvitations}
                </CardTitle>
                <CardDescription>
                  {t.users.pendingInvitationsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => {
                    const isExpired = isPast(new Date(invitation.expires_at))
                    return (
                      <div
                        key={invitation.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isExpired ? 'bg-muted/50 opacity-60' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{invitation.email}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge className={`${ROLE_COLORS[invitation.role]} text-white text-[10px] px-1.5 py-0`}>
                                {getRoleLabel(invitation.role)}
                              </Badge>
                              {isExpired ? (
                                <span className="text-destructive flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {t.users.inviteExpired}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {t.users.expiresOn} {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManageUsers && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvite(invitation)}
                              className="h-8 px-2 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              {t.users.resendInvite}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvite(invitation)}
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3 mr-1" />
                              {t.users.cancelInvite}
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.users.teamMembers}
                </CardTitle>
                <CardDescription>
                  {t.users.manageRoles}
                </CardDescription>
              </div>
              <Button
                className="gap-2"
                onClick={() => setShowInvite(true)}
                disabled={!canManageUsers}
              >
                <UserPlus className="h-4 w-4" />
                {t.users.inviteUser}
              </Button>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t.users.noUsers}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.users.user}</TableHead>
                      <TableHead>{t.users.email}</TableHead>
                      <TableHead>{t.users.role}</TableHead>
                      <TableHead>{t.users.joined}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className={canManageUsers ? "cursor-pointer hover:bg-muted/50" : ""}
                        onClick={() => canManageUsers && setSelectedUser(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-8 w-8 ring-2 ring-offset-2 ${ROLE_COLORS[user.role].replace('bg-', 'ring-')}/30`}>
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback className={`${ROLE_COLORS[user.role]} text-white`}>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {canManageUsers ? (
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                handleRoleChange(user.id, value as UserRole)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">{t.users.admin}</SelectItem>
                                <SelectItem value="sales">{t.users.sales}</SelectItem>
                                <SelectItem value="marketing">{t.users.marketing}</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={`${ROLE_COLORS[user.role]} text-white`}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onSuccess={() => {
          fetchUsers()
          fetchPendingInvitations()
        }}
      />

      {/* Team Member Preview Modal */}
      <TeamMemberPreviewModal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  )
}
