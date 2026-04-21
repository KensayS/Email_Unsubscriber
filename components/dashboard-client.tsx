'use client'

import { useState, useCallback, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TimeframeSelect } from '@/components/timeframe-select'
import { ThemeToggle } from '@/components/theme-toggle'
import { SenderListView } from '@/components/sender-list-view'
import { UnsubscribedView } from '@/components/unsubscribed-view'
import { SenderInfo, StreamEvent, Timeframe, UnsubscribeResult, UnsubscribedRecord } from '@/types'

export function DashboardClient() {
  const { data: session } = useSession()
  const [timeframe, setTimeframe] = useState<Timeframe>(1)
  const [activeTab, setActiveTab] = useState<'scan' | 'unsubscribed'>('scan')
  const [scanning, setScanning] = useState(false)
  const [senders, setSenders] = useState<SenderInfo[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()
  const [unsubscribedCount, setUnsubscribedCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const refreshUnsubscribedCount = useCallback(async () => {
    try {
      const response = await fetch('/api/unsubscribes')
      if (response.ok) {
        const records = await response.json()
        setUnsubscribedCount(records.length)
      }
    } catch (err) {
      console.error('Error fetching unsubscribed count:', err)
    }
  }, [])

  useEffect(() => {
    refreshUnsubscribedCount()
  }, [])

  const handleScan = useCallback(async () => {
    setMobileMenuOpen(false)
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
              setActiveTab('scan')
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
          refreshUnsubscribedCount()
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
    <div className="min-h-screen bg-background dark:bg-background transition-colors duration-300">
      {/* Scan Progress Bar */}
      {scanning && (
        <div className="relative h-1 bg-muted dark:bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-accent to-transparent"
            style={{
              animation: 'smooth-progress 2.5s ease-in-out infinite',
            }}
          >
            <style>{`
              @keyframes smooth-progress {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(400%); }
                100% { transform: translateX(400%); }
              }
            `}</style>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 dark:opacity-0 animate-pulse"></div>
        </div>
      )}

      {/* Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 md:hidden bg-black/50 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          style={{ zIndex: 30 }}
        />
      )}

      {/* Right Sidebar Menu - Glassmorphism with Rows Layout */}
      <div
        className={`fixed right-0 top-[73px] bottom-0 w-64 md:hidden backdrop-blur-xl transition-transform duration-500 ease-out flex flex-col items-start justify-start border-l border-white/10 overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <style>{`
          @keyframes slideInGlass {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideInRow {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .sidebar-row {
            animation: slideInRow 0.4s ease-out forwards;
          }
          .sidebar-row:nth-child(1) {
            animation-delay: 0.1s;
          }
          .sidebar-row:nth-child(2) {
            animation-delay: 0.2s;
          }
        `}</style>

        {/* Theme Row */}
        <div className="sidebar-row w-full px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3 justify-between">
            <span className="text-sm font-semibold text-foreground/80">Theme</span>
            <div className="transform transition-transform hover:scale-110 duration-300">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Sign Out Row */}
        <div className="sidebar-row w-full px-4 py-4">
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full border-2 border-destructive/50 hover:border-destructive hover:bg-destructive/10 text-destructive font-semibold py-2 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Sign out
          </Button>
        </div>

        {/* Decorative glow element */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgb(56, 116, 255), transparent)',
          }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-border dark:border-border bg-background dark:bg-card transition-colors duration-300 relative" style={{ zIndex: 40 }}>
        {/* Main Header Row */}
        <div className="flex items-center gap-3 justify-between px-4 py-4 lg:px-8">
          <h1 className="font-bold text-xl text-[#1a1a1a] dark:text-[#e5e5e5] tracking-tight">📧 Email Unsubscriber</h1>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            <TimeframeSelect value={timeframe} onChange={setTimeframe} disabled={scanning} />
            <Button onClick={handleScan} disabled={scanning} size="sm">
              {scanning ? 'Scanning…' : 'Scan'}
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="border-2 border-destructive hover:bg-destructive/5 text-destructive font-medium">
              Sign out
            </Button>
          </div>

          {/* Mobile Controls - Always visible */}
          <div className="flex md:hidden items-center gap-2">
            <TimeframeSelect value={timeframe} onChange={setTimeframe} disabled={scanning} />
            <Button onClick={handleScan} disabled={scanning} size="sm">
              {scanning ? 'Scanning…' : 'Scan'}
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Switcher - only show when senders exist */}
        {senders.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                activeTab === 'scan'
                  ? 'bg-[#1a1a1a] text-white dark:bg-[#d4d4d4] dark:text-[#0f0f0f]'
                  : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#1a1a1a] dark:hover:text-[#e5e5e5]'
              }`}
            >
              Scan Results ({senders.length})
            </button>
            <button
              onClick={() => setActiveTab('unsubscribed')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                activeTab === 'unsubscribed'
                  ? 'bg-[#1a1a1a] text-white dark:bg-[#d4d4d4] dark:text-[#0f0f0f]'
                  : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#1a1a1a] dark:hover:text-[#e5e5e5]'
              }`}
            >
              Unsubscribed ({unsubscribedCount})
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="w-full px-4 py-6 space-y-3 lg:px-8">

        {/* Stats bar - shown after scan completes */}
        {done && senders.length > 0 && activeTab === 'scan' && (
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3] text-center py-2">
            Found <strong className="text-[#1a1a1a] dark:text-[#e5e5e5]">{senders.length}</strong> mailing lists
          </p>
        )}

        {error && (
          <p className="text-destructive text-sm text-center py-4">{error}</p>
        )}

        {!scanning && senders.length === 0 && !done && !error && (
          <p className="text-[#737373] dark:text-[#a3a3a3] text-center py-12">
            Select a timeframe and click <strong>Scan</strong> to find your mailing lists.
          </p>
        )}

        {scanning && senders.length === 0 && (
          <p className="text-[#737373] dark:text-[#a3a3a3] text-center py-12 animate-pulse">
            Scanning your inbox…
          </p>
        )}

        {done && senders.length === 0 && (
          <p className="text-[#737373] dark:text-[#a3a3a3] text-center py-12">
            No mailing lists found in the selected timeframe.
          </p>
        )}

        {/* Scan Results Tab */}
        {activeTab === 'scan' && senders.length > 0 && (
          <SenderListView
            senders={senders}
            onUnsubscribe={handleUnsubscribe}
          />
        )}

        {/* Unsubscribed Tab */}
        {activeTab === 'unsubscribed' && session && (
          <UnsubscribedView />
        )}
      </main>
    </div>
  )
}
