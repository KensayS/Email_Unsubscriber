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

export function SenderList({ senders, onUnsubscribe }: Props) {
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
    } catch {
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
    <div className="w-full space-y-3">
      {senders.map((sender) => {
        const status = statuses[sender.email] || 'idle'
        const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
        const label = BUTTON_LABELS[status]

        return (
          <div
            key={sender.email}
            className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-base truncate">{sender.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {sender.count} emails
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{sender.email}</p>
              </div>
              <Button
                size="sm"
                variant={
                  status === 'unsubscribed' ? 'secondary'
                  : status === 'not_found' ? 'ghost'
                  : 'default'
                }
                disabled={isDisabled}
                onClick={() => handleButtonClick(sender)}
                className="shrink-0 whitespace-nowrap"
              >
                {label}
              </Button>
            </div>
            {buildSubjectSnippet(sender.subjects, sender.email) && (
              <p className="text-sm text-muted-foreground">
                {buildSubjectSnippet(sender.subjects, sender.email)}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
