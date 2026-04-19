'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus } from '@/types'
import { buildSubjectSnippet } from '@/lib/summary'

interface Props {
  sender: SenderInfo
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

export function SenderCard({ sender, onUnsubscribe }: Props) {
  const [status, setStatus] = useState<UnsubscribeStatus>('idle')
  const [openUrl, setOpenUrl] = useState<string>()

  const snippet = buildSubjectSnippet(sender.subjects, sender.email)

  async function handleUnsubscribe() {
    if (!onUnsubscribe || status !== 'idle') return
    setStatus('loading')

    try {
      const result = await onUnsubscribe(sender)
      setStatus(result.status as UnsubscribeStatus)
      if (result.url) setOpenUrl(result.url)
    } catch {
      setStatus('idle')
    }
  }

  function handleButtonClick() {
    if (status === 'open_link' || status === 'finish_in_new_tab') {
      if (openUrl) window.open(openUrl, '_blank', 'noopener,noreferrer')
      return
    }
    handleUnsubscribe()
  }

  const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
  const label = BUTTON_LABELS[status]

  return (
    <Card className="w-full">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{sender.name}</span>
            <Badge variant="secondary">{sender.count} emails</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{sender.email}</p>
          <p className="mt-1 text-sm text-muted-foreground truncate">{snippet}</p>
        </div>
        <Button
          size="sm"
          variant={
            status === 'unsubscribed' ? 'secondary'
            : status === 'not_found' ? 'ghost'
            : 'default'
          }
          disabled={isDisabled}
          onClick={handleButtonClick}
          className="shrink-0 whitespace-nowrap"
        >
          {label}
        </Button>
      </CardContent>
    </Card>
  )
}
