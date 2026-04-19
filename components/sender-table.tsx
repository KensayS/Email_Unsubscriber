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

export function SenderTable({ senders, onUnsubscribe }: Props) {
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
    <div className="w-full rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Sender</th>
              <th className="text-left px-4 py-2 font-semibold">Email</th>
              <th className="text-right px-4 py-2 font-semibold w-20">Count</th>
              <th className="text-right px-4 py-2 font-semibold w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {senders.map((sender) => {
              const status = statuses[sender.email] || 'idle'
              const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
              const label = BUTTON_LABELS[status]

              return (
                <tr key={sender.email} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2">
                    <div className="font-medium truncate">{sender.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{buildSubjectSnippet(sender.subjects, sender.email)}</div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs truncate">{sender.email}</td>
                  <td className="px-4 py-2 text-right">
                    <Badge variant="secondary">{sender.count}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant={
                        status === 'unsubscribed' ? 'secondary'
                        : status === 'not_found' ? 'ghost'
                        : 'default'
                      }
                      disabled={isDisabled}
                      onClick={() => handleButtonClick(sender)}
                      className="text-xs whitespace-nowrap"
                    >
                      {label}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
