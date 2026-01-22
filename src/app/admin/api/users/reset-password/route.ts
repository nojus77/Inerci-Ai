import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json() as { userId: string }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if caller is authenticated and is admin
    const supabase = await createClient()
    const { data: { user: callerUser } } = await supabase.auth.getUser()

    if (!callerUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if caller is admin
    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can reset passwords' }, { status: 403 })
    }

    // Use admin client for password reset
    const adminClient = createAdminClient()

    // Generate new password
    const newPassword = generatePassword()

    // Update user password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error resetting password:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get the app URL for the login link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.inerci.ai'
    const loginUrl = `${appUrl}/admin/login`

    return NextResponse.json({
      success: true,
      newPassword,
      loginUrl,
      message: 'Password has been reset successfully',
    })

  } catch (error) {
    console.error('Error in reset password API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
