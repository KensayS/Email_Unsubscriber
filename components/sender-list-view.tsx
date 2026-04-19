'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus } from '@/types'
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
      <div className="w-full rounded-lg border bg-card overflow-hidden">
        <div className="divide-y">
          <div className="hidden md:grid grid-cols-12 gap-2 bg-muted/40 px-4 py-3 font-semibold text-sm h-12 items-center">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2 text-right">Count</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {senders.map((sender) => {
            const status = statuses[sender.email] || 'idle'
            const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
            const label = BUTTON_LABELS[status]

            return (
              <div
                key={sender.email}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/40 transition-colors items-center md:h-14"
              >
                {/* Name - full width on mobile, 4 cols on desktop */}
                <div className="col-span-12 md:col-span-4 min-w-0">
                  <div className="font-medium text-sm truncate">{sender.name}</div>
                  <button
                    onClick={() => setSelectedSender(sender)}
                    className="text-xs text-blue-600 hover:underline truncate text-left"
                  >
                    See details
                  </button>
                </div>

                {/* Email - hidden on mobile */}
                <div className="hidden md:block md:col-span-4 min-w-0">
                  <div className="text-sm text-muted-foreground truncate">{sender.email}</div>
                </div>

                {/* Count */}
                <div className="col-span-3 md:col-span-2 text-right">
                  <Badge variant="secondary" className="text-xs">
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
