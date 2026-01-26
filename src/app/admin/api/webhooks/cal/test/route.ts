import { NextResponse } from 'next/server'

// Test endpoint to simulate a Cal.com booking webhook
// Visit this URL to test: /admin/api/webhooks/cal/test
export async function GET() {
  const testPayload = {
    triggerEvent: 'BOOKING_CREATED',
    createdAt: new Date().toISOString(),
    payload: {
      title: 'Test Audit Call',
      description: 'Test booking created via test endpoint',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      uid: 'test-' + Date.now(),
      bookingId: Date.now(),
      status: 'ACCEPTED',
      attendees: [
        {
          email: 'test@example.com',
          name: 'Test Client',
          timeZone: 'Europe/Vilnius',
        }
      ],
      organizer: {
        email: 'admin@inerci.lt',
        name: 'Inerci Admin',
        timeZone: 'Europe/Vilnius',
      }
    }
  }

  try {
    // Call the actual webhook handler
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const webhookUrl = `${baseUrl}/admin/api/webhooks/cal`

    console.log('Test webhook: Calling', webhookUrl)
    console.log('Test webhook: Payload:', JSON.stringify(testPayload, null, 2))

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      webhookUrl,
      testPayload,
      webhookResponse: result,
      message: response.ok
        ? 'Test booking created! Check the calendar and clients list.'
        : 'Webhook call failed - check server logs'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testPayload,
      message: 'Failed to call webhook endpoint'
    }, { status: 500 })
  }
}
