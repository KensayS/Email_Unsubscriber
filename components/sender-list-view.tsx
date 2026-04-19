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

export function SenderListView({ senders, onUnsubscribe }: Props) {
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
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-semibold text-sm h-12">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-sm h-12 hidden md:table-cell">Email</th>
              <th className="text-right px-4 py-3 font-semibold text-sm h-12 w-24">Count</th>
              <th className="text-right px-4 py-3 font-semibold text-sm h-12 w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {senders.map((sender) => {
              const status = statuses[sender.email] || 'idle'
              const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
              const label = BUTTON_LABELS[status]
              const initials = sender.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <tr
                  key={sender.email}
                  className="hover:bg-muted/40 transition-colors h-16"
                >
                  {/* Name with Avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{sender.name}</div>
                        <div className="text-xs text-muted-foreground truncate md:hidden">
                          {sender.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate hidden md:hidden">
                          {buildSubjectSnippet(sender.subjects, sender.email)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email (hidden on mobile) */}
                  <td className="px-4 py-3 text-muted-foreground text-sm truncate hidden md:table-cell">
                    {sender.email}
                  </td>

                  {/* Count */}
                  <td className="px-4 py-3 text-right">
                    <Badge variant="secondary" className="text-xs justify-center w-16">
                      {sender.count}
                    </Badge>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
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
