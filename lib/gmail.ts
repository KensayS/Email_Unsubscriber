import { google } from 'googleapis'
import { SenderInfo } from '@/types'

export function parseSenderHeader(from: string): { name: string; email: string } {
  if (!from) return { name: '', email: '' }

  const angleMatch = from.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/)
  if (angleMatch) {
    return { name: angleMatch[1].trim(), email: angleMatch[2].trim() }
  }

  return { name: from.trim(), email: from.trim() }
}

export function extractUnsubscribeUrl(header: string | undefined): string | null {
  if (!header) return null
  const match = header.match(/<(https?:\/\/[^>]+)>/)
  return match ? match[1] : null
}

export function extractMailtoAddress(header: string | undefined): string | null {
  if (!header) return null
  const match = header.match(/<mailto:([^>]+)>/)
  return match ? match[1] : null
}

export async function fetchSenders(
  accessToken: string,
  afterDate: Date
): Promise<SenderInfo[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const gmail = google.gmail({ version: 'v1', auth })

  const afterStr = afterDate.toISOString().slice(0, 10).replace(/-/g, '/')
  const query = `category:promotions after:${afterStr}`

  const messageIds: string[] = []
  let pageToken: string | undefined

  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 500,
      pageToken,
    })
    const messages = response.data.messages || []
    messageIds.push(...messages.map((m) => m.id!).filter(Boolean))
    pageToken = response.data.nextPageToken || undefined
  } while (pageToken)

  const senderMap = new Map<string, SenderInfo>()
  const BATCH_SIZE = 25

  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE)
    const details = await Promise.all(
      batch.map((id) =>
        gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'List-Unsubscribe', 'List-Unsubscribe-Post'],
        })
      )
    )

    for (const detail of details) {
      const headers = detail.data.payload?.headers || []
      const get = (name: string) => headers.find((h) => h.name === name)?.value

      const from = get('From') || ''
      const subject = get('Subject') || ''
      const listUnsubscribe = get('List-Unsubscribe') || undefined
      const listUnsubscribePost = get('List-Unsubscribe-Post') || undefined

      const { name, email } = parseSenderHeader(from)
      if (!email) continue

      const existing = senderMap.get(email)
      if (existing) {
        existing.count++
        if (subject && existing.subjects.length < 5) existing.subjects.push(subject)
        // Capture header from any email in the thread that has it
        if (listUnsubscribe && !existing.listUnsubscribe) {
          existing.listUnsubscribe = listUnsubscribe
          existing.listUnsubscribePost = listUnsubscribePost
        }
      } else {
        senderMap.set(email, {
          name: name || email,
          email,
          count: 1,
          subjects: subject ? [subject] : [],
          listUnsubscribe,
          listUnsubscribePost,
        })
      }
    }
  }

  return Array.from(senderMap.values())
    .filter((s) => s.count >= 2 && s.listUnsubscribe)
    .sort((a, b) => b.count - a.count)
}
