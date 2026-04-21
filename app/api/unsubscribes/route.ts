import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchUserUnsubscribesList } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    console.log('[unsubscribes] Unauthorized: no session or user ID')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[unsubscribes] Fetching unsubscribes for user:', session.user.id)
    const records = await fetchUserUnsubscribesList(session.user.id)
    console.log('[unsubscribes] Retrieved', records.length, 'unsubscribed records')
    return Response.json(records)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[unsubscribes] Error fetching unsubscribes:', errorMessage)
    return Response.json(
      { error: 'Failed to fetch unsubscribes' },
      { status: 500 }
    )
  }
}
