'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus } from '@/types'
import { buildSubjectSnippet } from '@/lib/summary'

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

export function SenderGrid({ senders, onUnsubscribe }: Props) {
  const [statuses, setStatuses] = useState<Record<string, UnsubscribeStatus>>({})
  const [urls, setUrls] = useState<Record<string, string>>({})

  async function handleUnsubscribe(sender: SenderInfo) {
    if (!onUnsubscribe || statuses[sender.email] !== 'idle') return
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
    if (status === 'open_link' || status === 'finish_in_new_tab') {
      const url = urls[sender.email]
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    handleUnsubscribe(sender)
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {senders.map((sender) => {
        const status = statuses[sender.email] || 'idle'
        const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
        const label = BUTTON_LABELS[status]

        return (
          <div
            key={sender.email}
            className="rounded-lg border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col"
          >
            {/* Content */}
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-sm line-clamp-1 break-words">{sender.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{sender.email}</p>
              </div>

              {buildSubjectSnippet(sender.subjects, sender.email) && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {buildSubjectSnippet(sender.subjects, sender.email)}
                </p>
              )}

              <div className="flex items-center gap-2 mt-auto">
                <Badge variant="secondary" className="text-xs">
                  {sender.count}
                </Badge>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-4 pb-4 pt-0">
              <Button
                size="sm"
                variant={
                  status === 'unsubscribed' ? 'secondary'
                  : status === 'not_found' ? 'ghost'
                  : 'default'
                }
                disabled={isDisabled}
                onClick={() => handleButtonClick(sender)}
                className="w-full text-xs h-8"
              >
                {label}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
