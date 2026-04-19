export interface SenderInfo {
  name: string
  email: string
  count: number
  subjects: string[]
  listUnsubscribe?: string
  listUnsubscribePost?: string
}

export type UnsubscribeStatus =
  | 'idle'
  | 'loading'
  | 'unsubscribed'
  | 'already_unsubscribed'
  | 'open_link'
  | 'finish_in_new_tab'
  | 'not_found'

export interface UnsubscribeResult {
  status: Exclude<UnsubscribeStatus, 'idle' | 'loading'>
  url?: string
}

export type StreamEvent =
  | { type: 'sender'; data: SenderInfo }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type Timeframe = 1 | 3

export type ViewMode = 'grid' | 'list'
