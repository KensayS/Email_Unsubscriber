'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus, UnsubscribedRecord } from '@/types'
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
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set())
  const [unsubscribedEmails, setUnsubscribedEmails] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchUnsubscribed() {
      try {
        const response = await fetch('/api/unsubscribes')
        if (response.ok) {
          const records = (await response.json()) as UnsubscribedRecord[]
          setUnsubscribedEmails(new Set(records.map((r) => r.sender_email)))
        }
      } catch (err) {
        console.error('[SenderGrid] Error fetching unsubscribed:', err)
      }
    }
    fetchUnsubscribed()
  }, [])

  console.log('[SenderGrid] Initialized with onUnsubscribe:', !!onUnsubscribe)

  async function handleUnsubscribe(sender: SenderInfo) {
    const currentStatus = statuses[sender.email] || 'idle'
    console.log(`[SenderGrid] handleUnsubscribe called for ${sender.email}`)
    console.log(`[SenderGrid] onUnsubscribe defined: ${!!onUnsubscribe}`)
    console.log(`[SenderGrid] Current status: ${currentStatus}`)

    if (!onUnsubscribe) {
      console.error('[SenderGrid] onUnsubscribe is not defined!')
      return
    }
    if (currentStatus !== 'idle') {
      console.log(`[SenderGrid] Status is not idle, aborting: ${currentStatus}`)
      return
    }
    console.log(`[SenderGrid] Setting status to loading for ${sender.email}`)
    setStatuses((p) => ({ ...p, [sender.email]: 'loading' }))

    try {
      console.log(`[SenderGrid] Calling onUnsubscribe for ${sender.email}`)
      const result = await onUnsubscribe(sender)
      console.log(`[SenderGrid] Got result:`, result)
      setStatuses((p) => ({ ...p, [sender.email]: result.status as UnsubscribeStatus }))
      if (result.url) {
        setUrls((p) => ({ ...p, [sender.email]: result.url! }))
      }

      // Fade out card after success
      if (result.status === 'unsubscribed') {
        setTimeout(() => {
          setFadingOut((p) => new Set([...p, sender.email]))
        }, 400)
      }
    } catch (error) {
      console.error(`[SenderGrid] Failed to unsubscribe from ${sender.email}:`, error)
      setStatuses((p) => ({ ...p, [sender.email]: 'idle' }))
    }
  }

  function handleButtonClick(sender: SenderInfo) {
    const status = statuses[sender.email] || 'idle'
    console.log(`[SenderGrid] Button clicked for ${sender.email}, status: ${status}`)
    console.log(`[SenderGrid] Sender data:`, {
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
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {senders
        .filter((s) => !fadingOut.has(s.email) && !unsubscribedEmails.has(s.email))
        .map((sender) => {
          const status = statuses[sender.email] || 'idle'
          const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
          const label = BUTTON_LABELS[status]

          return (
            <div
              key={sender.email}
              className={`rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] shadow-sm dark:shadow-sm hover:shadow-md dark:hover:shadow-md transition-all overflow-hidden flex flex-col group ${
                status === 'unsubscribed' ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              {/* Content */}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-[#1a1a1a] dark:text-[#e5e5e5] line-clamp-1 break-words group-hover:text-[#7bb3f5] dark:group-hover:text-[#0066cc] transition-colors">{sender.name}</h3>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-1.5 line-clamp-1">{sender.email}</p>
                </div>

                {buildSubjectSnippet(sender.subjects, sender.email) && (
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3] line-clamp-2 italic opacity-80">
                    "{buildSubjectSnippet(sender.subjects, sender.email)}"
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  <Badge className="text-xs bg-[#e5e5e5] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-[#e5e5e5] font-medium">
                    {sender.count} {sender.count === 1 ? 'email' : 'emails'}
                  </Badge>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-5 pb-5 pt-0">
                <Button
                  size="sm"
                  variant={
                    status === 'unsubscribed'
                      ? 'secondary'
                      : status === 'not_found'
                        ? 'ghost'
                        : 'default'
                  }
                  disabled={isDisabled}
                  onClick={() => handleButtonClick(sender)}
                  className={`w-full text-xs h-9 font-medium transition-all duration-200 ${
                    status === 'unsubscribed'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700'
                      : status === 'loading'
                        ? 'opacity-75'
                        : ''
                  } ${status === 'loading' ? 'animate-pulse' : ''}`}
                >
                  {status === 'loading' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-current animate-pulse" />
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </Button>
              </div>
            </div>
          )
        })}
    </div>
  )
}
