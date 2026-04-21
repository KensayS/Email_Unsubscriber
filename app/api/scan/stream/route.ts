import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchSenders } from '@/lib/gmail'
import { StreamEvent } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const months = Math.min(parseInt(url.searchParams.get('months') || '6', 10), 24)
  const afterDate = new Date()
  afterDate.setMonth(afterDate.getMonth() - months)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const senders = await fetchSenders(session.accessToken, afterDate)

        for (const sender of senders) {
          controller.enqueue(encode({ type: 'sender', data: sender }))
        }

        controller.enqueue(encode({ type: 'done' }))
        controller.close()
      } catch (error) {
        console.error('[scan/stream] fetchSenders error:', error)
        controller.enqueue(
          encode({ type: 'error', message: 'Scan failed. Please try again.' })
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
