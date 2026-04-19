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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg border shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b bg-background p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{sender.name}</h2>
            <p className="text-sm text-muted-foreground truncate">{sender.email}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Email Count</h4>
            <Badge variant="secondary">{sender.count} emails</Badge>
          </div>

          {buildSubjectSnippet(sender.subjects, sender.email) && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Recent Subject</h4>
              <p className="text-sm text-muted-foreground">{buildSubjectSnippet(sender.subjects, sender.email)}</p>
            </div>
          )}

          {sender.subjects.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">All Subjects ({sender.subjects.length})</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto rounded-md bg-muted/30 p-3">
                {sender.subjects.map((subject, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {subject}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background p-4 flex gap-2">
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
            onClick={() => onUnsubscribe(sender)}
            className="flex-1"
          >
            {BUTTON_LABELS[status]}
          </Button>
        </div>
      </div>
    </div>
  )
}
