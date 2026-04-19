'use client'

import { useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { TimeframeSelect } from '@/components/timeframe-select'
import { SenderCard } from '@/components/sender-card'
import { SenderInfo, StreamEvent, Timeframe, UnsubscribeResult } from '@/types'

export function DashboardClient() {
  const [timeframe, setTimeframe] = useState<Timeframe>(6)
  const [scanning, setScanning] = useState(false)
  const [senders, setSenders] = useState<SenderInfo[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()

  const handleScan = useCallback(async () => {
    setSenders([])
    setDone(false)
    setError(undefined)
    setScanning(true)

    try {
      const response = await fetch(`/api/scan/stream?months=${timeframe}`)
      if (!response.ok) throw new Error('Scan failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent

            if (event.type === 'sender') {
              setSenders((prev) => {
                const exists = prev.some((s) => s.email === event.data.email)
                if (exists) return prev
                const next = [...prev, event.data]
                return next.sort((a, b) => b.count - a.count)
              })
            } else if (event.type === 'done') {
              setDone(true)
            } else if (event.type === 'error') {
              setError(event.message)
            }
          } catch {
            // malformed event, skip
          }
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setScanning(false)
    }
  }, [timeframe])

  async function handleUnsubscribe(sender: SenderInfo): Promise<UnsubscribeResult> {
    const response = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listUnsubscribe: sender.listUnsubscribe,
        listUnsubscribePost: sender.listUnsubscribePost,
      }),
    })

    if (!response.ok) throw new Error('Unsubscribe request failed')
    return response.json()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <h1 className="font-bold text-lg flex-1">Email Unsubscriber</h1>
        <TimeframeSelect value={timeframe} onChange={setTimeframe} disabled={scanning} />
        <Button onClick={handleScan} disabled={scanning} size="sm">
          {scanning ? 'Scanning…' : 'Scan'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign out
        </Button>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {error && (
          <p className="text-destructive text-sm text-center py-4">{error}</p>
        )}

        {!scanning && senders.length === 0 && !done && !error && (
          <p className="text-muted-foreground text-center py-12">
            Select a timeframe and click <strong>Scan</strong> to find your mailing lists.
          </p>
        )}

        {scanning && senders.length === 0 && (
          <p className="text-muted-foreground text-center py-12 animate-pulse">
            Scanning your inbox…
          </p>
        )}

        {done && senders.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No mailing lists found in the selected timeframe.
          </p>
        )}

        {senders.map((sender) => (
          <SenderCard
            key={sender.email}
            sender={sender}
            onUnsubscribe={handleUnsubscribe}
          />
        ))}
      </main>
    </div>
  )
}
