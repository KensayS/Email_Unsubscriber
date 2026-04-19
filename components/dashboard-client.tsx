'use client'

import { useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { TimeframeSelect } from '@/components/timeframe-select'
import { ViewModeSelect } from '@/components/view-mode-select'
import { SenderGrid } from '@/components/sender-grid'
import { SenderListView } from '@/components/sender-list-view'
import { SenderInfo, StreamEvent, Timeframe, ViewMode, UnsubscribeResult } from '@/types'

export function DashboardClient() {
  const [timeframe, setTimeframe] = useState<Timeframe>(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [scanning, setScanning] = useState(false)
  const [senders, setSenders] = useState<SenderInfo[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()
  const [warningsMinimized, setWarningsMinimized] = useState(false)

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
      <header className="border-b px-4 py-4 lg:px-8 flex items-center gap-3 justify-between flex-wrap">
        <h1 className="font-bold text-lg">Email Unsubscriber</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <TimeframeSelect value={timeframe} onChange={setTimeframe} disabled={scanning} />
          <Button onClick={handleScan} disabled={scanning} size="sm">
            {scanning ? 'Scanning…' : 'Scan'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {warningsMinimized && (
            <button
              onClick={() => setWarningsMinimized(false)}
              className="text-xl hover:opacity-70 transition-opacity"
              title="Show warnings"
            >
              ⚠️
            </button>
          )}
          {senders.length > 0 && <ViewModeSelect value={viewMode} onChange={setViewMode} disabled={scanning} />}
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-4 py-6 space-y-3 lg:px-8">
        {!warningsMinimized && (
          <div className="space-y-3">
            {/* Session persistence warning */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-900 dark:text-amber-100 flex items-start gap-3">
              <div className="flex-1">
                <strong>Note:</strong> This app uses no database. If you unsubscribe, the list will still appear across sessions. Unsubscription is permanent in your inbox, but the scan results are not stored.
              </div>
              <button
                onClick={() => setWarningsMinimized(true)}
                className="text-amber-900 dark:text-amber-100 hover:opacity-70 transition-opacity flex-shrink-0 text-lg"
                title="Minimize warnings"
              >
                ✕
              </button>
            </div>

            {/* 3 months warning */}
            {timeframe >= 3 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-900 dark:text-blue-100 flex items-start gap-3">
                <div className="flex-1">
                  <strong>Heads up:</strong> Scanning {timeframe} months takes significantly longer. Start with 1 month for faster results.
                </div>
                <button
                  onClick={() => setWarningsMinimized(true)}
                  className="text-blue-900 dark:text-blue-100 hover:opacity-70 transition-opacity flex-shrink-0 text-lg"
                  title="Minimize warnings"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

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

        {senders.length > 0 && (
          <>
            {viewMode === 'grid' && (
              <SenderGrid
                senders={senders}
                onUnsubscribe={handleUnsubscribe}
              />
            )}
            {viewMode === 'list' && (
              <SenderListView
                senders={senders}
                onUnsubscribe={handleUnsubscribe}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
