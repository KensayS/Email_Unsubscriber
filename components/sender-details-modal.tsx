'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SenderInfo, UnsubscribeStatus } from '@/types'
import { buildSubjectSnippet } from '@/lib/summary'

interface Props {
  sender: SenderInfo | null
  onClose: () => void
  onUnsubscribe: (sender: SenderInfo) => void
  status: UnsubscribeStatus
  buttonLabel: string
  isDisabled: boolean
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

export function SenderDetailsModal({ sender, onClose, onUnsubscribe, status, isDisabled }: Props) {
  if (!sender) return null

  const handleClick = () => {
    console.log(`[Modal] Unsubscribe clicked for ${sender.email}`)
    console.log(`[Modal] Sender data:`, {
      name: sender.name,
      email: sender.email,
      listUnsubscribe: sender.listUnsubscribe,
      listUnsubscribePost: sender.listUnsubscribePost
    })
    onUnsubscribe(sender)
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] shadow-2xl dark:shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-[#f5f5f5] dark:bg-[#2d2d2d] rounded-t-[12px] p-6 flex items-center justify-between shadow-sm">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-[#1a1a1a] dark:text-[#e5e5e5] truncate">{sender.name}</h2>
            <p className="text-sm text-[#737373] dark:text-[#a3a3a3] truncate">{sender.email}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-[#1a1a1a] dark:text-[#e5e5e5] hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 transition-all text-2xl leading-none rounded-full w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-[#1a1a1a] dark:text-[#e5e5e5] mb-3 opacity-80">Email Count</h4>
            <Badge className="bg-[#e5e5e5] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-[#e5e5e5] font-bold text-sm px-3 py-1">
              {sender.count} {sender.count === 1 ? 'email' : 'emails'}
            </Badge>
          </div>

          {buildSubjectSnippet(sender.subjects, sender.email) && (
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-[#1a1a1a] dark:text-[#e5e5e5] mb-3 opacity-80">Recent Subject</h4>
              <p className="text-sm text-[#737373] dark:text-[#a3a3a3] italic border-l-2 border-[#d4d4d4] dark:border-[#3f3f3f] pl-3">"{buildSubjectSnippet(sender.subjects, sender.email)}"</p>
            </div>
          )}

          {sender.subjects.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-[#1a1a1a] dark:text-[#e5e5e5] mb-3 opacity-80">All Subjects ({sender.subjects.length})</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto rounded-lg bg-[#f5f5f5] dark:bg-[#2d2d2d] p-4 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)]">
                {sender.subjects.map((subject, idx) => (
                  <li key={idx} className="text-sm text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                    <span className="text-[#7bb3f5] dark:text-[#0066cc] font-bold mr-2">•</span>{subject}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] rounded-b-[12px] p-4 flex gap-2 transition-colors duration-300">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            variant={
              status === 'unsubscribed' ? 'secondary'
              : status === 'not_found' ? 'ghost'
              : 'default'
            }
            disabled={isDisabled}
            onClick={handleClick}
            className="flex-1"
          >
            {BUTTON_LABELS[status]}
          </Button>
        </div>
      </div>
    </div>
  )
}
