import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendSlackNotification,
  formatTaskDueMessage,
} from '@/lib/integrations/slack'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient()
  // Verify cron secret if configured
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find tasks due within the next 24 hours that haven't had reminders sent
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, client:clients(company_name)')
      .eq('status', 'pending')
      .is('reminder_sent_at', null)
      .lte('due_date', tomorrow.toISOString())
      .gte('due_date', now.toISOString())

    if (tasksError) {
      throw tasksError
    }

    // Get Slack config
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'slack_config')
      .single()

    const slackConfig = settings?.value as { webhook_url?: string; enabled_events?: string[] }

    const results = []

    for (const task of tasks || []) {
      // Mark reminder as sent
      await supabase
        .from('tasks')
        .update({ reminder_sent_at: now.toISOString() })
        .eq('id', task.id)

      // Send Slack notification if configured
      if (
        slackConfig?.webhook_url &&
        slackConfig?.enabled_events?.includes('task_due')
      ) {
        const client = task.client as { company_name: string } | null
        const message = formatTaskDueMessage(
          task.title,
          client?.company_name || null,
          task.due_date!
        )
        await sendSlackNotification(slackConfig.webhook_url, message)
      }

      results.push({ taskId: task.id, title: task.title })
    }

    return NextResponse.json({
      success: true,
      reminders_sent: results.length,
      tasks: results,
    })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
