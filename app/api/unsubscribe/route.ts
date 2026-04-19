import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performUnsubscribe } from '@/lib/unsubscribe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { listUnsubscribe, listUnsubscribePost } = body as {
    listUnsubscribe?: string
    listUnsubscribePost?: string
  }

  try {
    console.log('[unsubscribe] Attempting unsubscribe with:', {
      hasListUnsubscribe: !!listUnsubscribe,
      hasListUnsubscribePost: !!listUnsubscribePost,
      listUnsubscribePreview: listUnsubscribe?.substring(0, 50),
    })

    const result = await performUnsubscribe(
      listUnsubscribe,
      listUnsubscribePost,
      session.accessToken
    )

    console.log('[unsubscribe] Result:', result)
    return Response.json(result)
  } catch (error) {
    console.error('[unsubscribe] Error:', error)
    return Response.json(
      { error: 'Unsubscribe failed. Please try again.' },
      { status: 500 }
    )
  }
}
