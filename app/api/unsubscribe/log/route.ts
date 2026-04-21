import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logUnsubscribe } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { senderEmail, senderName, unsubscribedAt } = body as {
      senderEmail?: string
      senderName?: string
      unsubscribedAt?: string
    }

    // Validate required fields
    if (!senderEmail || !senderName || !unsubscribedAt) {
      return Response.json(
        { error: 'Missing required fields: senderEmail, senderName, unsubscribedAt' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    console.log(
      `[unsubscribe/log] Logging unsubscribe for ${userId} ${senderEmail}`
    )

    // Log the unsubscribe action
    const success = await logUnsubscribe(
      userId,
      senderEmail,
      senderName,
      unsubscribedAt
    )

    if (!success) {
      return Response.json(
        { error: 'Failed to log unsubscribe' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[unsubscribe/log] Error:', error)
    return Response.json(
      { error: 'Failed to log unsubscribe' },
      { status: 500 }
    )
  }
}
