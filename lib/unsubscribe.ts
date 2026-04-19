import { google } from 'googleapis'
import { extractUnsubscribeUrl, extractMailtoAddress } from '@/lib/gmail'
import { UnsubscribeResult } from '@/types'

type UnsubscribeAction =
  | { method: 'post'; url: string }
  | { method: 'mailto'; address: string; subject: string }
  | { method: 'url'; url: string }
  | { method: 'not_found' }

export function buildUnsubscribeAction(
  listUnsubscribe: string | undefined,
  listUnsubscribePost: string | undefined
): UnsubscribeAction {
  const url = extractUnsubscribeUrl(listUnsubscribe)
  const mailto = extractMailtoAddress(listUnsubscribe)

  if (listUnsubscribePost && url) {
    return { method: 'post', url }
  }

  if (mailto) {
    const [address, queryString] = mailto.split('?')
    const params = new URLSearchParams(queryString || '')
    return {
      method: 'mailto',
      address,
      subject: params.get('subject') || 'Unsubscribe',
    }
  }

  if (url) {
    return { method: 'url', url }
  }

  return { method: 'not_found' }
}

export async function performUnsubscribe(
  listUnsubscribe: string | undefined,
  listUnsubscribePost: string | undefined,
  accessToken: string
): Promise<UnsubscribeResult> {
  const action = buildUnsubscribeAction(listUnsubscribe, listUnsubscribePost)
  console.log('[performUnsubscribe] Action method:', action.method, action)

  if (action.method === 'post') {
    try {
      const response = await fetch(action.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      })

      if (response.status === 200 || response.status === 204) {
        return { status: 'unsubscribed' }
      }
      if (response.status === 409 || response.status === 422) {
        return { status: 'already_unsubscribed' }
      }
      return { status: 'open_link', url: action.url }
    } catch {
      return { status: 'open_link', url: action.url }
    }
  }

  if (action.method === 'mailto') {
    const message = [
      `To: ${action.address}`,
      `Subject: ${action.subject}`,
      `Content-Type: text/plain`,
      '',
      'Please unsubscribe me from this mailing list.',
    ].join('\r\n')

    const encoded = Buffer.from(message).toString('base64url')

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    const gmail = google.gmail({ version: 'v1', auth })

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    })

    return { status: 'unsubscribed' }
  }

  if (action.method === 'url') {
    return { status: 'finish_in_new_tab', url: action.url }
  }

  return { status: 'not_found' }
}
