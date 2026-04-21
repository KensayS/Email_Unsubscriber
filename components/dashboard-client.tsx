'use client'

import { useState, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { TimeframeSelect } from '@/components/timeframe-select'
import { ViewModeSelect } from '@/components/view-mode-select'
import { SenderGrid } from '@/components/sender-grid'
import { SenderListView } from '@/components/sender-list-view'
import { UnsubscribedView } from '@/components/unsubscribed-view'
import { SenderInfo, StreamEvent, Timeframe, ViewMode, UnsubscribeResult, UnsubscribedRecord } from '@/types'

export function DashboardClient() {
  const { data: session } = useSession()
  const [timeframe, setTimeframe] = useState<Timeframe>(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<'scan' | 'unsubscribed'>('scan')
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
              // Fetch and filter unsubscribed senders
              try {
                const unsubscribedRes = await fetch('/api/unsubscribes')
                if (unsubscribedRes.ok) {
                  const unsubscribes = (await unsubscribedRes.json()) as UnsubscribedRecord[]
                  const unsubscribedEmails = new Set(unsubscribes.map((r) => r.sender_email))
                  setSenders((prev) => prev.filter((s) => !unsubscribedEmails.has(s.email)))
                  console.log('[Dashboard] Filtered senders, removed', unsubscribes.length, 'already unsubscribed')
                } else {
                  console.error('[Dashboard] Failed to fetch unsubscribes:', unsubscribedRes.statusText)
                }
              } catch (err) {
                console.error('[Dashboard] Error filtering unsubscribed senders:', err)
                // Don't break UX, continue with unfiltered results
              }
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
    console.log(`[Dashboard] Starting unsubscribe for ${sender.email}`)
    console.log(`[Dashboard] Sending headers:`, {
      listUnsubscribe: sender.listUnsubscribe,
      listUnsubscribePost: sender.listUnsubscribePost,
    })

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listUnsubscribe: sender.listUnsubscribe,
          listUnsubscribePost: sender.listUnsubscribePost,
        }),
      })

      console.log(`[Dashboard] Got response, status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[Dashboard] Error response:`, errorData)
        throw new Error(errorData.error || 'Unsubscribe request failed')
      }

      const result = await response.json()
      console.log(`[Dashboard] Unsubscribe ${sender.email}: ${result.status}`, result)

      // Log to database if unsubscribe was successful
      if (result.status === 'unsubscribed' || result.status === 'already_unsubscribed') {
        try {
          console.log(`[Dashboard] Logging unsubscribe to database for ${sender.email}`)
          await fetch('/api/unsubscribe/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderEmail: sender.email,
              senderName: sender.name,
              unsubscribedAt: new Date().toISOString(),
            }),
          })
        } catch (err) {
          console.error('[Dashboard] Error logging unsubscribe:', err)
        }
      }

      return result
    } catch (error) {
      console.error(`[Dashboard] Exception in handleUnsubscribe:`, error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0f0a1a] transition-colors duration-300">
      {/* Scan Progress Bar */}
      {scanning && (
        <div
          className="h-1.5 bg-gradient-to-r from-[#7e43ff] via-[#c084fc] to-[#7e43ff] relative overflow-hidden shadow-lg shadow-[#7e43ff]/50"
          style={{
            animation: 'indeterminate-progress 2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes indeterminate-progress {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[rgba(38,17,74,0.08)] dark:border-[rgba(167,139,250,0.15)] px-4 py-4 lg:px-8 bg-white dark:bg-[#1a1428] transition-colors duration-300">
        <div className="flex items-center gap-3 justify-between flex-wrap mb-3">
          <h1 className="font-bold text-xl text-[#26114a] dark:text-[#f5f3ff] tracking-tight">📧 Inbox Manager</h1>
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
            {senders.length > 0 && activeTab === 'scan' && <ViewModeSelect value={viewMode} onChange={setViewMode} disabled={scanning} />}
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </Button>
          </div>
        </div>

        {/* Tab Switcher - only show when senders exist */}
        {senders.length > 0 && (
          <div className="flex items-center gap-2 pt-3 -mx-4 -mb-4 px-4">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                activeTab === 'scan'
                  ? 'bg-[#26114a] text-white'
                  : 'text-[#9491a1] hover:text-[#26114a]'
              }`}
            >
              Scan Results ({senders.length})
            </button>
            <button
              onClick={() => setActiveTab('unsubscribed')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                activeTab === 'unsubscribed'
                  ? 'bg-[#26114a] text-white'
                  : 'text-[#9491a1] hover:text-[#26114a]'
              }`}
            >
              Unsubscribed
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="w-full px-4 py-6 space-y-3 lg:px-8">
        {!warningsMinimized && (
          <div className="rounded-lg bg-[#f5f0ff] border border-[rgba(38,17,74,0.12)] p-3 text-sm text-[#26114a] flex items-start gap-3">
            <div className="flex-1">
              <strong>Note:</strong> Unsubscription is permanent in your inbox. Scans are saved per session, but synced across browser tabs with your account.
            </div>
            <button
              onClick={() => setWarningsMinimized(true)}
              className="text-[#26114a] hover:opacity-70 transition-opacity flex-shrink-0 text-lg"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats bar - shown after scan completes */}
        {done && senders.length > 0 && activeTab === 'scan' && (
          <p className="text-sm text-[#9491a1] text-center py-2">
            Found <strong className="text-[#26114a]">{senders.length}</strong> mailing lists
          </p>
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

        {/* Scan Results Tab */}
        {activeTab === 'scan' && senders.length > 0 && (
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

        {/* Unsubscribed Tab */}
        {activeTab === 'unsubscribed' && session && (
          <UnsubscribedView />
        )}
      </main>
    </div>
  )
}
