import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchSenders } from '@/lib/gmail'
import { StreamEvent } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()

    if (msg.includes('quotaexceeded') || msg.includes('quota exceeded')) {
      return 'Gmail API quota exceeded. Please try again tomorrow.'
    }
    if (msg.includes('ratelimit') || msg.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (msg.includes('authentication') || msg.includes('unauthenticated')) {
      return 'Authentication failed. Please sign in again.'
    }
    if (msg.includes('forbidden')) {
      return 'Permission denied. Please check your Google account permissions.'
    }
    if (msg.includes('invalid') && msg.includes('argument')) {
      return 'Invalid scan parameters. Please refresh and try again.'
    }
    if (msg.includes('internalerror') || msg.includes('internal error')) {
      return 'Gmail service error. Please try again in a moment.'
    }
  }
  return 'Scan failed. Please try again.'
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
        const errorMessage = getErrorMessage(error)
        controller.enqueue(encode({ type: 'error', message: errorMessage }))
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
