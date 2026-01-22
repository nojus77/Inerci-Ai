interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
}

interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
  }
  elements?: unknown[]
}

export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    return response.ok
  } catch (error) {
    console.error('Slack notification error:', error)
    return false
  }
}

export function formatProposalSentMessage(
  clientName: string,
  proposalTitle: string
): SlackMessage {
  return {
    text: `Proposal sent to ${clientName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Proposal Sent*\n\n:page_facing_up: *${proposalTitle}*\n:office: Client: ${clientName}`,
        },
      },
    ],
  }
}

export function formatStageChangedMessage(
  clientName: string,
  fromStage: string,
  toStage: string
): SlackMessage {
  const stageEmoji: Record<string, string> = {
    lead: ':seedling:',
    audit_scheduled: ':calendar:',
    audit_done: ':white_check_mark:',
    prototype_building: ':hammer_and_wrench:',
    prototype_delivered: ':package:',
    proposal_draft: ':memo:',
    proposal_sent: ':outbox_tray:',
    negotiation: ':handshake:',
    won: ':trophy:',
    lost: ':x:',
    on_hold: ':pause_button:',
  }

  return {
    text: `${clientName} moved to ${toStage}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Pipeline Update*\n\n:office: *${clientName}*\n${stageEmoji[fromStage] || ':arrow_right:'} ${fromStage} → ${stageEmoji[toStage] || ':arrow_right:'} ${toStage}`,
        },
      },
    ],
  }
}

export function formatAuditCompletedMessage(
  clientName: string,
  sessionTitle: string
): SlackMessage {
  return {
    text: `Audit completed for ${clientName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Audit Completed*\n\n:white_check_mark: *${sessionTitle}*\n:office: Client: ${clientName}`,
        },
      },
    ],
  }
}

export function formatTaskDueMessage(
  taskTitle: string,
  clientName: string | null,
  dueDate: string
): SlackMessage {
  return {
    text: `Task due: ${taskTitle}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Task Due*\n\n:bell: *${taskTitle}*${clientName ? `\n:office: Client: ${clientName}` : ''}\n:clock1: Due: ${new Date(dueDate).toLocaleString()}`,
        },
      },
    ],
  }
}
