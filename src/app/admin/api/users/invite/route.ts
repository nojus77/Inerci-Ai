import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

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
    const { email, role, name } = await request.json() as {
      email: string
      role: UserRole
      name?: string
    }

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Only admins can invite users' }, { status: 403 })
    }

    // Use admin client for user creation
    const adminClient = createAdminClient()

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email)

    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Create user with password
    const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role,
        invited: true,
        name: name || email.split('@')[0],
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Create user profile in users table
    if (newAuthUser?.user) {
      await adminClient.from('users').insert({
        id: newAuthUser.user.id,
        email: email,
        name: name || email.split('@')[0],
        role: role,
      })
    }

    // Get the app URL for the login link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.inerci.ai'
    const loginUrl = `${appUrl}/admin/login`

    return NextResponse.json({
      success: true,
      tempPassword,
      loginUrl,
      message: `User ${email} has been created successfully`,
    })

  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
