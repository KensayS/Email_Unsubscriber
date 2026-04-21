'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus } from '@/types'
import { SenderDetailsModal } from '@/components/sender-details-modal'

const AVATAR_COLORS = [
  '#e4d8fd', // lavender
  '#d4e8f7', // sky
  '#fce4ec', // rose
  '#f3e5f5', // light purple
  '#e0f2f1', // teal
  '#fff3e0', // amber
]

function getAvatarColor(name: string): string {
  const code = name.charCodeAt(0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

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
      <div className="w-full rounded-lg border border-[rgba(38,17,74,0.08)] dark:border-[rgba(167,139,250,0.15)] bg-white dark:bg-[#1a1428] overflow-hidden shadow-sm dark:shadow-lg dark:shadow-[#7e43ff]/10 transition-all duration-300">
        <div className="divide-y divide-[rgba(38,17,74,0.08)] dark:divide-[rgba(167,139,250,0.15)]">
          <div className="hidden md:grid grid-cols-12 gap-2 bg-[#f5f0ff] dark:bg-[#2d1b4e] px-4 py-3 font-semibold text-xs uppercase tracking-wide text-[#26114a] dark:text-[#c084fc] h-12 items-center transition-colors duration-300">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2 text-right">Count</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {senders.map((sender) => {
            const status = statuses[sender.email] || 'idle'
            const isDisabled = status === 'loading' || status === 'unsubscribed' || status === 'not_found'
            const label = BUTTON_LABELS[status]
            const initial = sender.name[0]?.toUpperCase() || 'U'
            const avatarColor = getAvatarColor(sender.name)

            return (
              <div
                key={sender.email}
                className="group grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f5f0ff] dark:hover:bg-[#2d1b4e] transition-colors items-center md:h-14"
              >
                {/* Avatar + Name - full width on mobile, 4 cols on desktop */}
                <div className="col-span-12 md:col-span-4 min-w-0 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#26114a] dark:text-[#f5f3ff] truncate group-hover:text-[#7e43ff] dark:group-hover:text-[#c084fc] transition-colors">{sender.name}</div>
                    <button
                      onClick={() => setSelectedSender(sender)}
                      className="text-xs text-[#7e43ff] dark:text-[#c084fc] hover:underline truncate text-left opacity-80 hover:opacity-100 transition-opacity"
                    >
                      See details
                    </button>
                  </div>
                </div>

                {/* Email - hidden on mobile */}
                <div className="hidden md:block md:col-span-4 min-w-0">
                  <div className="text-sm text-[#9491a1] dark:text-[#b8a7d6] truncate">{sender.email}</div>
                </div>

                {/* Count */}
                <div className="col-span-3 md:col-span-2 text-right">
                  <Badge className="text-xs bg-[#e4d8fd] dark:bg-[#7e43ff]/30 text-[#26114a] dark:text-[#c084fc] font-medium">
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
