'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus, UnsubscribedRecord } from '@/types'
import { SenderDetailsModal } from '@/components/sender-details-modal'


interface Props {
  senders: SenderInfo[]
  onUnsubscribe?: (sender: SenderInfo) => Promise<UnsubscribeResult>
}

const BUTTON_LABELS: Record<UnsubscribeStatus, string> = {
  idle: 'Unsubscribe',
  loading: 'Unsubscribing…',
  unsubscribed: '✓ Unsubscribed',
  already_unsubscribed: 'Already unsubscribed',
  open_link: 'Open link ↗',
  finish_in_new_tab: 'Finish in new tab ↗',
  not_found: 'No unsubscribe found',
}

export function SenderListView({ senders, onUnsubscribe }: Props) {
  const [statuses, setStatuses] = useState<Record<string, UnsubscribeStatus>>({})
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [selectedSender, setSelectedSender] = useState<SenderInfo | null>(null)
  const [unsubscribedEmails, setUnsubscribedEmails] = useState<Set<string>>(new Set())
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchUnsubscribed() {
      try {
        const response = await fetch('/api/unsubscribes')
        if (response.ok) {
          const records = (await response.json()) as UnsubscribedRecord[]
          setUnsubscribedEmails(new Set(records.map((r) => r.sender_email)))
        }
      } catch (err) {
        console.error('[SenderListView] Error fetching unsubscribed:', err)
      }
    }
    fetchUnsubscribed()
  }, [])

  async function handleUnsubscribe(sender: SenderInfo) {
    const currentStatus = statuses[sender.email] || 'idle'
    if (!onUnsubscribe || currentStatus !== 'idle') return
    setStatuses((p) => ({ ...p, [sender.email]: 'loading' }))

    try {
      const result = await onUnsubscribe(sender)
      setStatuses((p) => ({ ...p, [sender.email]: result.status as UnsubscribeStatus }))
      if (result.url) {
        setUrls((p) => ({ ...p, [sender.email]: result.url! }))
      }

      if (result.status === 'unsubscribed') {
        setTimeout(() => {
          setFadingOut((p) => new Set([...p, sender.email]))
        }, 400)
      }
    } catch (error) {
      console.error(`Failed to unsubscribe from ${sender.email}:`, error)
      setStatuses((p) => ({ ...p, [sender.email]: 'idle' }))
    }
  }

  function handleButtonClick(sender: SenderInfo) {
    const status = statuses[sender.email] || 'idle'
    console.log(`[SenderListView] Button clicked for ${sender.email}, status: ${status}`)
    console.log(`[SenderListView] Sender data:`, {
      name: sender.name,
      email: sender.email,
      listUnsubscribe: sender.listUnsubscribe,
      listUnsubscribePost: sender.listUnsubscribePost
    })

    if (status === 'open_link' || status === 'finish_in_new_tab') {
      const url = urls[sender.email]
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    handleUnsubscribe(sender)
  }

  return (
    <>
      <div className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm dark:shadow-sm transition-all duration-300">
        <div className="divide-y divide-[rgba(0,0,0,0.08)] dark:divide-[rgba(255,255,255,0.1)]">
          <div className="hidden md:grid grid-cols-12 gap-2 bg-[#f5f5f5] dark:bg-[#2d2d2d] px-4 py-3 font-semibold text-xs uppercase tracking-wide text-[#525252] dark:text-[#a3a3a3] h-12 items-center transition-colors duration-300">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2 text-right">Count</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {senders
            .filter((s) => !unsubscribedEmails.has(s.email) && !fadingOut.has(s.email))
            .map((sender) => {
            const status = statuses[sender.email] || 'idle'
            const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
            const label = BUTTON_LABELS[status]
            const isFading = fadingOut.has(sender.email)

            return (
              <div
                key={sender.email}
                className={`group grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f5f5f5] dark:hover:bg-[#2d2d2d] transition-all items-center md:h-14 ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {/* Name - full width on mobile, 4 cols on desktop */}
                <div className="col-span-12 md:col-span-4 min-w-0">
                  <div className="font-semibold text-sm text-[#1a1a1a] dark:text-[#e5e5e5] truncate group-hover:text-[#7bb3f5] dark:group-hover:text-[#0066cc] transition-colors">{sender.name}</div>
                  <button
                    onClick={() => setSelectedSender(sender)}
                    className="text-xs text-[#7bb3f5] dark:text-[#0066cc] hover:underline truncate text-left opacity-80 hover:opacity-100 transition-opacity"
                  >
                    See details
                  </button>
                </div>

                {/* Email - hidden on mobile */}
                <div className="hidden md:block md:col-span-4 min-w-0">
                  <div className="text-sm text-[#737373] dark:text-[#a3a3a3] truncate">{sender.email}</div>
                </div>

                {/* Count */}
                <div className="col-span-3 md:col-span-2 text-right">
                  <Badge className="text-xs bg-[#e5e5e5] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-[#e5e5e5] font-medium">
                    {sender.count}
                  </Badge>
                </div>

                {/* Action Button */}
                <div className="col-span-9 md:col-span-2 text-right">
                  <Button
                    size="sm"
                    variant={
                      status === 'unsubscribed' ? 'secondary'
                      : status === 'not_found' ? 'ghost'
                      : 'default'
                    }
                    disabled={isDisabled}
                    onClick={() => handleButtonClick(sender)}
                    className="text-xs whitespace-nowrap h-8 w-full md:w-auto"
                  >
                    {label}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Details Modal */}
      <SenderDetailsModal
        sender={selectedSender}
        onClose={() => setSelectedSender(null)}
        onUnsubscribe={handleButtonClick}
        status={statuses[selectedSender?.email || ''] || 'idle'}
        buttonLabel={BUTTON_LABELS[statuses[selectedSender?.email || ''] || 'idle']}
        isDisabled={
          statuses[selectedSender?.email || ''] === 'loading' ||
          statuses[selectedSender?.email || ''] === 'unsubscribed' ||
          statuses[selectedSender?.email || ''] === 'not_found'
        }
      />
    </>
  )
}
