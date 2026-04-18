# Gmail Unsubscriber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployed Next.js web app where users sign in with Google, scan their Gmail inbox for mailing lists, and unsubscribe with one click.

**Architecture:** Next.js 14 App Router handles both frontend and backend API routes. Gmail is scanned via Google OAuth access token server-side only, results stream to the browser via Server-Sent Events. Gemini 1.5 Flash generates AI summaries progressively after sender cards appear.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, NextAuth.js v4, googleapis, @google/generative-ai, Jest, React Testing Library, Vercel

---

## File Map

| File | Responsibility |
|---|---|
| `types/index.ts` | Shared TypeScript types |
| `types/next-auth.d.ts` | NextAuth session type extension |
| `lib/auth.ts` | NextAuth configuration (authOptions) |
| `lib/gmail.ts` | Gmail API: fetch message IDs, extract headers, aggregate senders |
| `lib/unsubscribe.ts` | Unsubscribe logic: POST → mailto → URL → not found |
| `lib/gemini.ts` | Gemini API: generate single-sentence summaries |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route handler |
| `app/api/scan/stream/route.ts` | SSE endpoint: streams senders then summaries |
| `app/api/unsubscribe/route.ts` | Handles unsubscribe POST request |
| `middleware.ts` | Protects /dashboard, redirects unauthenticated users |
| `components/timeframe-select.tsx` | Controlled dropdown for scan timeframe |
| `components/sender-card.tsx` | Mailing list card with unsubscribe button |
| `components/mock-dashboard.tsx` | Static preview with fake data for landing page |
| `app/page.tsx` | Landing page: sign-in + mock preview |
| `app/dashboard/page.tsx` | Dashboard: scan controls + streaming card list |
| `CLAUDE.md` | Project context for Claude Code sessions |
| `__tests__/lib/gmail.test.ts` | Unit tests for gmail.ts |
| `__tests__/lib/unsubscribe.test.ts` | Unit tests for unsubscribe.ts |
| `__tests__/lib/gemini.test.ts` | Unit tests for gemini.ts |
| `__tests__/components/sender-card.test.tsx` | Component tests for SenderCard |
| `__tests__/components/timeframe-select.test.tsx` | Component tests for TimeframeSelect |

---

## Task 1: Project Scaffold & Dependencies

**Files:**
- Create: `package.json` (via npx)
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Scaffold Next.js app**

Run from `c:\Users\kensa\Email_Unsubscriber`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-turbopack
```
Answer prompts: Yes to TypeScript, Yes to ESLint, Yes to Tailwind, Yes to App Router.

- [ ] **Step 2: Install dependencies**

```bash
npm install next-auth googleapis @google/generative-ai
npm install --save-dev jest jest-environment-jsdom jest-environment-node @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest ts-jest
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```
When prompted: Default style, Default base color (Zinc), yes to CSS variables.

Then add the components we'll need:
```bash
npx shadcn@latest add button badge card select
```

- [ ] **Step 4: Create Jest config**

Create `jest.config.js`:
```js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  testEnvironment: 'node',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
})
```

Note: Component tests that need `jsdom` use the `/** @jest-environment jsdom */` docblock at the top of the file — already included in all component test files in this plan.

Create `jest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create environment files**

Create `.env.example`:
```
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

Create `.env.local` with the same keys (fill in real values when you have them). Add `.env.local` to `.gitignore` (should already be there from create-next-app).

- [ ] **Step 6: Verify scaffold**

```bash
npm run dev
```
Expected: Server starts on http://localhost:3000 with default Next.js landing page. Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: initial Next.js scaffold with dependencies"
```

---

## Task 2: Shared Types

**Files:**
- Create: `types/index.ts`
- Create: `types/next-auth.d.ts`

- [ ] **Step 1: Create shared types**

Create `types/index.ts`:
```ts
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
  | { type: 'summary'; email: string; summary: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type Timeframe = 1 | 3 | 6 | 12 | 24
```

- [ ] **Step 2: Extend NextAuth types**

Create `types/next-auth.d.ts`:
```ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add types/
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Auth Configuration

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create auth options**

Create `lib/auth.ts`:
```ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
          ].join(' '),
          access_type: 'online',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours max, but cookie is session-only
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // No maxAge = session cookie (expires when browser closes)
      },
    },
  },
}
```

- [ ] **Step 2: Create auth route handler**

Create `app/api/auth/[...nextauth]/route.ts`:
```ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Generate NEXTAUTH_SECRET**

```bash
openssl rand -base64 32
```
Copy the output into `.env.local` as `NEXTAUTH_SECRET`.

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts app/api/auth/
git commit -m "feat: configure NextAuth with Google OAuth and Gmail scopes"
```

---

## Task 4: Route Protection Middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware**

Create `middleware.ts` at the project root:
```ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

This uses NextAuth's built-in middleware which redirects unauthenticated requests to the sign-in page.

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /dashboard with NextAuth middleware"
```

---

## Task 5: Gmail Library (TDD)

**Files:**
- Create: `lib/gmail.ts`
- Create: `__tests__/lib/gmail.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/gmail.test.ts`:
```ts
import { parseSenderHeader, extractUnsubscribeUrl, extractMailtoAddress } from '@/lib/gmail'

describe('parseSenderHeader', () => {
  it('extracts email and name from "Name <email>" format', () => {
    const result = parseSenderHeader('Nike <news@nike.com>')
    expect(result).toEqual({ name: 'Nike', email: 'news@nike.com' })
  })

  it('extracts email from bare email format', () => {
    const result = parseSenderHeader('news@nike.com')
    expect(result).toEqual({ name: 'news@nike.com', email: 'news@nike.com' })
  })

  it('strips surrounding quotes from name', () => {
    const result = parseSenderHeader('"Nike News" <news@nike.com>')
    expect(result).toEqual({ name: 'Nike News', email: 'news@nike.com' })
  })

  it('returns empty strings for empty input', () => {
    const result = parseSenderHeader('')
    expect(result).toEqual({ name: '', email: '' })
  })
})

describe('extractUnsubscribeUrl', () => {
  it('extracts HTTPS URL from List-Unsubscribe header', () => {
    const header = '<https://example.com/unsub?id=123>, <mailto:unsub@example.com>'
    expect(extractUnsubscribeUrl(header)).toBe('https://example.com/unsub?id=123')
  })

  it('returns null when no URL present', () => {
    expect(extractUnsubscribeUrl('<mailto:unsub@example.com>')).toBeNull()
  })

  it('returns null for undefined header', () => {
    expect(extractUnsubscribeUrl(undefined)).toBeNull()
  })
})

describe('extractMailtoAddress', () => {
  it('extracts mailto address from List-Unsubscribe header', () => {
    const header = '<https://example.com/unsub>, <mailto:unsub@example.com?subject=unsubscribe>'
    expect(extractMailtoAddress(header)).toBe('unsub@example.com?subject=unsubscribe')
  })

  it('returns null when no mailto present', () => {
    expect(extractMailtoAddress('<https://example.com/unsub>')).toBeNull()
  })

  it('returns null for undefined header', () => {
    expect(extractMailtoAddress(undefined)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/gmail.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/gmail'"

- [ ] **Step 3: Implement gmail.ts**

Create `lib/gmail.ts`:
```ts
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

  const afterTimestamp = Math.floor(afterDate.getTime() / 1000)
  const query = `after:${afterTimestamp} has:list-unsubscribe`

  // Collect all message IDs
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

  // Batch fetch message headers (25 at a time)
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
      const listUnsubscribe = get('List-Unsubscribe')
      const listUnsubscribePost = get('List-Unsubscribe-Post')

      const { name, email } = parseSenderHeader(from)
      if (!email) continue

      const existing = senderMap.get(email)
      if (existing) {
        existing.count++
        if (subject && existing.subjects.length < 5) existing.subjects.push(subject)
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

  return Array.from(senderMap.values()).sort((a, b) => b.count - a.count)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/gmail.test.ts --no-coverage
```
Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/gmail.ts __tests__/lib/gmail.test.ts
git commit -m "feat: add Gmail API library with header parsing utilities"
```

---

## Task 6: Unsubscribe Library (TDD)

**Files:**
- Create: `lib/unsubscribe.ts`
- Create: `__tests__/lib/unsubscribe.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/unsubscribe.test.ts`:
```ts
import { buildUnsubscribeAction } from '@/lib/unsubscribe'

describe('buildUnsubscribeAction', () => {
  it('returns post action when List-Unsubscribe-Post header is present with URL', () => {
    const result = buildUnsubscribeAction(
      '<https://example.com/unsub>, <mailto:u@example.com>',
      'List-Unsubscribe=One-Click'
    )
    expect(result).toEqual({
      method: 'post',
      url: 'https://example.com/unsub',
    })
  })

  it('returns mailto action when only mailto is present', () => {
    const result = buildUnsubscribeAction(
      '<mailto:unsub@example.com?subject=unsubscribe>',
      undefined
    )
    expect(result).toEqual({
      method: 'mailto',
      address: 'unsub@example.com',
      subject: 'unsubscribe',
    })
  })

  it('returns url action when only URL is present (no Post header)', () => {
    const result = buildUnsubscribeAction('<https://example.com/unsub>', undefined)
    expect(result).toEqual({
      method: 'url',
      url: 'https://example.com/unsub',
    })
  })

  it('returns not_found when both headers are undefined', () => {
    const result = buildUnsubscribeAction(undefined, undefined)
    expect(result).toEqual({ method: 'not_found' })
  })

  it('prefers URL POST over mailto when Post header is present', () => {
    const result = buildUnsubscribeAction(
      '<https://example.com/unsub>',
      'List-Unsubscribe=One-Click'
    )
    expect(result.method).toBe('post')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/unsubscribe.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/unsubscribe'"

- [ ] **Step 3: Implement unsubscribe.ts**

Create `lib/unsubscribe.ts`:
```ts
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
      // Unexpected status — fall through to URL open
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/unsubscribe.test.ts --no-coverage
```
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/unsubscribe.ts __tests__/lib/unsubscribe.test.ts
git commit -m "feat: add unsubscribe library with POST/mailto/URL priority logic"
```

---

## Task 7: Gemini Library (TDD)

**Files:**
- Create: `lib/gemini.ts`
- Create: `__tests__/lib/gemini.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/gemini.test.ts`:
```ts
import { buildSummaryPrompt } from '@/lib/gemini'

describe('buildSummaryPrompt', () => {
  it('includes sender name in the prompt', () => {
    const prompt = buildSummaryPrompt(['Sale: 50% off everything'], 'Nike')
    expect(prompt).toContain('Nike')
  })

  it('includes subject lines in the prompt', () => {
    const prompt = buildSummaryPrompt(['Weekly digest', 'Top stories'], 'Newsletter')
    expect(prompt).toContain('Weekly digest')
    expect(prompt).toContain('Top stories')
  })

  it('limits to 5 subject lines', () => {
    const subjects = ['s1', 's2', 's3', 's4', 's5', 's6', 's7']
    const prompt = buildSummaryPrompt(subjects, 'Sender')
    expect(prompt).toContain('s5')
    expect(prompt).not.toContain('s6')
  })

  it('handles empty subjects gracefully', () => {
    const prompt = buildSummaryPrompt([], 'Sender')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/gemini.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/gemini'"

- [ ] **Step 3: Implement gemini.ts**

Create `lib/gemini.ts`:
```ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const RATE_LIMIT_DELAY_MS = 4500 // 15 RPM free tier = 1 per 4s, with buffer

export function buildSummaryPrompt(subjects: string[], senderName: string): string {
  if (subjects.length === 0) {
    return `Write a single sentence (max 15 words) describing what kind of emails "${senderName}" likely sends. Be specific and concise. Reply with only the sentence.`
  }

  const lines = subjects.slice(0, 5).join('\n')
  return `Based on these email subject lines from "${senderName}", write a single sentence (max 15 words) describing what kind of emails they send. Be specific and concise.

Subject lines:
${lines}

Reply with only the description sentence, nothing else.`
}

export async function generateSummary(
  subjects: string[],
  senderName: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = buildSummaryPrompt(subjects, senderName)

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return ''
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export { RATE_LIMIT_DELAY_MS }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/gemini.test.ts --no-coverage
```
Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/gemini.ts __tests__/lib/gemini.test.ts
git commit -m "feat: add Gemini library for AI email summaries"
```

---

## Task 8: Scan Stream API Route

**Files:**
- Create: `app/api/scan/stream/route.ts`

- [ ] **Step 1: Create the SSE streaming route**

Create `app/api/scan/stream/route.ts`:
```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchSenders } from '@/lib/gmail'
import { generateSummary, sleep, RATE_LIMIT_DELAY_MS } from '@/lib/gemini'
import { StreamEvent } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const months = Math.min(parseInt(url.searchParams.get('months') || '6', 10), 24)
  const afterDate = new Date()
  afterDate.setMonth(afterDate.getMonth() - months)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const senders = await fetchSenders(session.accessToken, afterDate)

        // Pass 1: stream all sender cards immediately
        for (const sender of senders) {
          controller.enqueue(encode({ type: 'sender', data: sender }))
        }

        // Pass 2: generate and stream summaries with rate limiting
        for (const sender of senders) {
          const summary = await generateSummary(sender.subjects, sender.name)
          if (summary) {
            controller.enqueue(
              encode({ type: 'summary', email: sender.email, summary })
            )
          }
          await sleep(RATE_LIMIT_DELAY_MS)
        }

        controller.enqueue(encode({ type: 'done' }))
        controller.close()
      } catch (error) {
        controller.enqueue(
          encode({ type: 'error', message: 'Scan failed. Please try again.' })
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/scan/
git commit -m "feat: add SSE streaming scan endpoint"
```

---

## Task 9: Unsubscribe API Route

**Files:**
- Create: `app/api/unsubscribe/route.ts`

- [ ] **Step 1: Create the unsubscribe route**

Create `app/api/unsubscribe/route.ts`:
```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performUnsubscribe } from '@/lib/unsubscribe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { listUnsubscribe, listUnsubscribePost } = body as {
    listUnsubscribe?: string
    listUnsubscribePost?: string
  }

  try {
    const result = await performUnsubscribe(
      listUnsubscribe,
      listUnsubscribePost,
      session.accessToken
    )
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { error: 'Unsubscribe failed. Please try again.' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/unsubscribe/
git commit -m "feat: add unsubscribe API route"
```

---

## Task 10: TimeframeSelect Component (TDD)

**Files:**
- Create: `components/timeframe-select.tsx`
- Create: `__tests__/components/timeframe-select.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/timeframe-select.test.tsx`:
```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeframeSelect } from '@/components/timeframe-select'

describe('TimeframeSelect', () => {
  it('renders with default value label', () => {
    render(<TimeframeSelect value={6} onChange={jest.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onChange when a new option is selected', async () => {
    const onChange = jest.fn()
    render(<TimeframeSelect value={6} onChange={onChange} />)
    // shadcn Select uses combobox role
    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    // Options appear in a listbox
    const option = await screen.findByText('1 month')
    await userEvent.click(option)
    expect(onChange).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/timeframe-select.test.tsx --no-coverage
```
Expected: FAIL — "Cannot find module '@/components/timeframe-select'"

- [ ] **Step 3: Implement TimeframeSelect**

Create `components/timeframe-select.tsx`:
```tsx
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Timeframe } from '@/types'

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
]

interface Props {
  value: Timeframe
  onChange: (value: Timeframe) => void
  disabled?: boolean
}

export function TimeframeSelect({ value, onChange, disabled }: Props) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as Timeframe)}
      disabled={disabled}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/timeframe-select.test.tsx --no-coverage
```
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/timeframe-select.tsx __tests__/components/timeframe-select.test.tsx
git commit -m "feat: add TimeframeSelect component"
```

---

## Task 11: SenderCard Component (TDD)

**Files:**
- Create: `components/sender-card.tsx`
- Create: `__tests__/components/sender-card.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/sender-card.test.tsx`:
```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SenderCard } from '@/components/sender-card'
import { SenderInfo } from '@/types'

const mockSender: SenderInfo = {
  name: 'Nike',
  email: 'news@nike.com',
  count: 42,
  subjects: ['Sale: 50% off'],
  listUnsubscribe: '<https://nike.com/unsub>',
  listUnsubscribePost: 'List-Unsubscribe=One-Click',
}

describe('SenderCard', () => {
  it('renders sender name and email', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByText('Nike')).toBeInTheDocument()
    expect(screen.getByText('news@nike.com')).toBeInTheDocument()
  })

  it('renders email count badge', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByText('42 emails')).toBeInTheDocument()
  })

  it('shows AI summary when provided', () => {
    render(<SenderCard sender={mockSender} summary="Athletic gear and shoe promotions." />)
    expect(screen.getByText('Athletic gear and shoe promotions.')).toBeInTheDocument()
  })

  it('shows skeleton when summary is not yet loaded', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
  })

  it('renders Unsubscribe button in idle state', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument()
  })

  it('calls onUnsubscribe when button is clicked', async () => {
    const onUnsubscribe = jest.fn().mockResolvedValue({ status: 'unsubscribed' })
    render(<SenderCard sender={mockSender} onUnsubscribe={onUnsubscribe} />)
    await userEvent.click(screen.getByRole('button', { name: /unsubscribe/i }))
    expect(onUnsubscribe).toHaveBeenCalledWith(mockSender)
  })

  it('shows checkmark after successful unsubscribe', async () => {
    const onUnsubscribe = jest.fn().mockResolvedValue({ status: 'unsubscribed' })
    render(<SenderCard sender={mockSender} onUnsubscribe={onUnsubscribe} />)
    await userEvent.click(screen.getByRole('button', { name: /unsubscribe/i }))
    await waitFor(() => {
      expect(screen.getByText(/unsubscribed/i)).toBeInTheDocument()
    })
  })

  it('shows "No unsubscribe found" when status is not_found', async () => {
    const onUnsubscribe = jest.fn().mockResolvedValue({ status: 'not_found' })
    render(<SenderCard sender={mockSender} onUnsubscribe={onUnsubscribe} />)
    await userEvent.click(screen.getByRole('button', { name: /unsubscribe/i }))
    await waitFor(() => {
      expect(screen.getByText(/no unsubscribe found/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/sender-card.test.tsx --no-coverage
```
Expected: FAIL — "Cannot find module '@/components/sender-card'"

- [ ] **Step 3: Implement SenderCard**

Create `components/sender-card.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SenderInfo, UnsubscribeResult, UnsubscribeStatus } from '@/types'

interface Props {
  sender: SenderInfo
  summary?: string
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

export function SenderCard({ sender, summary, onUnsubscribe }: Props) {
  const [status, setStatus] = useState<UnsubscribeStatus>('idle')
  const [openUrl, setOpenUrl] = useState<string>()

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
          <div className="mt-1 text-sm text-muted-foreground min-h-[1.25rem]">
            {summary ? (
              <span>{summary}</span>
            ) : (
              <span
                data-testid="summary-skeleton"
                className="inline-block h-4 w-48 animate-pulse rounded bg-muted"
              />
            )}
          </div>
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/sender-card.test.tsx --no-coverage
```
Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/sender-card.tsx __tests__/components/sender-card.test.tsx
git commit -m "feat: add SenderCard component with all unsubscribe button states"
```

---

## Task 12: MockDashboard Component

**Files:**
- Create: `components/mock-dashboard.tsx`

- [ ] **Step 1: Implement MockDashboard**

Create `components/mock-dashboard.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const FAKE_SENDERS = [
  { name: 'Nike', email: 'news@nike.com', count: 87, summary: 'Weekly athletic gear sales and new product launches.' },
  { name: 'Medium Daily Digest', email: 'noreply@medium.com', count: 64, summary: 'Personalized daily article recommendations based on your reading history.' },
  { name: 'GitHub', email: 'noreply@github.com', count: 51, summary: 'Repository activity digests, security alerts, and team notifications.' },
  { name: 'Airbnb', email: 'no-reply@airbnb.com', count: 38, summary: 'Travel deal recommendations and booking reminders.' },
  { name: 'Duolingo', email: 'hello@duolingo.com', count: 30, summary: 'Daily streak reminders and language learning progress updates.' },
]

export function MockDashboard() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border bg-background shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
          unsubscriber.app/dashboard
        </div>
      </div>
      {/* App chrome */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-32 rounded-md border bg-muted animate-none text-xs flex items-center px-3 text-muted-foreground">
            6 months ▾
          </div>
          <div className="h-8 w-20 rounded-md bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
            Scan
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {FAKE_SENDERS.reduce((s, x) => s + x.count, 0)} emails found
          </span>
        </div>
        {FAKE_SENDERS.map((sender) => (
          <Card key={sender.email} className="w-full opacity-90">
            <CardContent className="flex items-start justify-between gap-4 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{sender.name}</span>
                  <Badge variant="secondary" className="text-xs">{sender.count} emails</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sender.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sender.summary}</p>
              </div>
              <Button size="sm" variant="default" className="shrink-0 text-xs h-7 px-3 pointer-events-none">
                Unsubscribe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/mock-dashboard.tsx
git commit -m "feat: add MockDashboard static preview component"
```

---

## Task 13: Landing Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css` (minor tweaks if needed)

- [ ] **Step 1: Implement landing page**

Replace the contents of `app/page.tsx`:
```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MockDashboard } from '@/components/mock-dashboard'
import { SignInButton } from '@/components/sign-in-button'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-16 gap-12 bg-background">
      {/* Hero */}
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Inbox Zero, Finally.</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Sign in with Gmail, see every mailing list you're on, and unsubscribe in one click.
          No data stored. Ever.
        </p>
        <SignInButton />
      </div>

      {/* Mock preview */}
      <div className="w-full max-w-2xl">
        <p className="text-center text-sm text-muted-foreground mb-4">Here's what it looks like</p>
        <MockDashboard />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create SignInButton client component**

Create `components/sign-in-button.tsx`:
```tsx
'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  return (
    <Button
      size="lg"
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      className="gap-2 text-base"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Sign in with Google
    </Button>
  )
}
```

- [ ] **Step 3: Add NextAuth SessionProvider**

Next.js App Router needs a client-side SessionProvider wrapper. Create `app/providers.tsx`:
```tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Update `app/layout.tsx` to wrap children with Providers:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Email Unsubscriber',
  description: 'See every mailing list you\'re on and unsubscribe in one click.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/layout.tsx app/providers.tsx components/sign-in-button.tsx
git commit -m "feat: build landing page with hero, sign-in button, and mock preview"
```

---

## Task 14: Dashboard Page

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `components/dashboard-client.tsx`

- [ ] **Step 1: Create dashboard client component**

Create `components/dashboard-client.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { TimeframeSelect } from '@/components/timeframe-select'
import { SenderCard } from '@/components/sender-card'
import { SenderInfo, StreamEvent, Timeframe, UnsubscribeResult } from '@/types'

export function DashboardClient() {
  const [timeframe, setTimeframe] = useState<Timeframe>(6)
  const [scanning, setScanning] = useState(false)
  const [senders, setSenders] = useState<SenderInfo[]>([])
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()

  const handleScan = useCallback(async () => {
    setSenders([])
    setSummaries({})
    setDone(false)
    setError(undefined)
    setScanning(true)

    try {
      const response = await fetch(`/api/scan/stream?months=${timeframe}`)
      if (!response.ok) throw new Error('Scan failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent

            if (event.type === 'sender') {
              setSenders((prev) => {
                const exists = prev.some((s) => s.email === event.data.email)
                if (exists) return prev
                const next = [...prev, event.data]
                return next.sort((a, b) => b.count - a.count)
              })
            } else if (event.type === 'summary') {
              setSummaries((prev) => ({ ...prev, [event.email]: event.summary }))
            } else if (event.type === 'done') {
              setDone(true)
            } else if (event.type === 'error') {
              setError(event.message)
            }
          } catch {
            // malformed event, skip
          }
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setScanning(false)
    }
  }, [timeframe])

  async function handleUnsubscribe(sender: SenderInfo): Promise<UnsubscribeResult> {
    const response = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listUnsubscribe: sender.listUnsubscribe,
        listUnsubscribePost: sender.listUnsubscribePost,
      }),
    })

    if (!response.ok) throw new Error('Unsubscribe request failed')
    return response.json()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <h1 className="font-bold text-lg flex-1">Email Unsubscriber</h1>
        <TimeframeSelect value={timeframe} onChange={setTimeframe} disabled={scanning} />
        <Button onClick={handleScan} disabled={scanning} size="sm">
          {scanning ? 'Scanning…' : 'Scan'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign out
        </Button>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {error && (
          <p className="text-destructive text-sm text-center py-4">{error}</p>
        )}

        {!scanning && senders.length === 0 && !done && !error && (
          <p className="text-muted-foreground text-center py-12">
            Select a timeframe and click <strong>Scan</strong> to find your mailing lists.
          </p>
        )}

        {scanning && senders.length === 0 && (
          <p className="text-muted-foreground text-center py-12 animate-pulse">
            Scanning your inbox…
          </p>
        )}

        {done && senders.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No mailing lists found in the selected timeframe.
          </p>
        )}

        {senders.map((sender) => (
          <SenderCard
            key={sender.email}
            sender={sender}
            summary={summaries[sender.email]}
            onUnsubscribe={handleUnsubscribe}
          />
        ))}

        {scanning && senders.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2 animate-pulse">
            Generating AI summaries…
          </p>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create dashboard page (server component)**

Create `app/dashboard/page.tsx`:
```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  return <DashboardClient />
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/ components/dashboard-client.tsx
git commit -m "feat: build dashboard with SSE streaming and sender card list"
```

---

## Task 15: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md**

Create `CLAUDE.md` at the project root:
```markdown
# Email Unsubscriber — Claude Code Context

## What This Is
A Next.js 14 web app where users sign in with Google OAuth, scan their Gmail inbox for mailing lists, and unsubscribe in one click. No database. No persistent storage. Session-based only.

## Stack
- **Framework:** Next.js 14 App Router + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (components in `components/ui/`)
- **Auth:** NextAuth.js v4 (`lib/auth.ts` holds `authOptions`)
- **Gmail:** googleapis package (`lib/gmail.ts`)
- **AI:** Gemini 1.5 Flash via `@google/generative-ai` (`lib/gemini.ts`)
- **Hosting:** Vercel (free tier)

## Environment Variables
All required in `.env.local` (see `.env.example`):
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally, your Vercel URL in production
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console → APIs & Services → Credentials. Enable Gmail API. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.
- `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey (free)

## Key Patterns

### Streaming Scan (SSE)
`/api/scan/stream` returns a `text/event-stream` response. Events are JSON:
- `{ type: "sender", data: SenderInfo }` — streamed immediately as senders are found
- `{ type: "summary", email: string, summary: string }` — streamed after all senders, rate-limited to 15/min (4.5s delay between Gemini calls)
- `{ type: "done" }` — scan complete
- `{ type: "error", message: string }` — something failed

Client reads this stream in `components/dashboard-client.tsx` using `ReadableStream` + `TextDecoder`.

### Unsubscribe Priority
`lib/unsubscribe.ts` → `buildUnsubscribeAction()` — checks in this order:
1. `List-Unsubscribe-Post` header + URL → HTTP POST (RFC 8058 one-click)
2. `List-Unsubscribe` mailto → send email via Gmail API
3. `List-Unsubscribe` URL only → return URL, client opens in new tab
4. Nothing → `not_found`

### Auth
Access token lives in the JWT session cookie only. Never sent to the browser. Retrieved server-side with `getServerSession(authOptions)`. Gmail OAuth scopes: `gmail.readonly` + `gmail.send`.

### Types
All shared types are in `types/index.ts`. NextAuth type extensions in `types/next-auth.d.ts`.

## Running Locally
```bash
npm run dev      # http://localhost:3000
npm test         # run all Jest tests
npm run build    # production build check
```

## Deploying to Vercel
1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add all env vars in Vercel → Settings → Environment Variables
4. Set `NEXTAUTH_URL` to your Vercel deployment URL (e.g. `https://email-unsubscriber.vercel.app`)
5. Add Vercel URL to Google Cloud Console → Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
6. Deploy
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with full project context"
```

---

## Task 16: Deploy to Vercel

**Prerequisite:** You need a GitHub account and a Vercel account (both free).

- [ ] **Step 1: Push to GitHub**

Create a new GitHub repo at https://github.com/new (name: `email-unsubscriber`, private is fine).

```bash
git remote add origin https://github.com/YOUR_USERNAME/email-unsubscriber.git
git push -u origin main
```

- [ ] **Step 2: Configure Google Cloud Console**

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "Email Unsubscriber")
3. Go to APIs & Services → Library → enable **Gmail API**
4. Go to APIs & Services → Credentials → Create credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized JavaScript origins: `http://localhost:3000`, `https://your-app.vercel.app`
7. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`, `https://your-app.vercel.app/api/auth/callback/google`
8. Copy Client ID and Client Secret

- [ ] **Step 3: Import to Vercel**

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework preset: Next.js (auto-detected)
4. Add environment variables:
   - `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = `https://your-app.vercel.app` (update after first deploy)
   - `GOOGLE_CLIENT_ID` (from step 2)
   - `GOOGLE_CLIENT_SECRET` (from step 2)
   - `GEMINI_API_KEY` (from https://aistudio.google.com/app/apikey)
5. Click Deploy

- [ ] **Step 4: Update NEXTAUTH_URL**

After first deploy, copy your Vercel URL (e.g. `https://email-unsubscriber-abc123.vercel.app`). Update `NEXTAUTH_URL` in Vercel env vars to match. Redeploy.

- [ ] **Step 5: End-to-end verification**

- [ ] Visit your Vercel URL → landing page with mock preview loads
- [ ] Click "Sign in with Google" → Google OAuth consent screen appears, requests Gmail permissions
- [ ] Complete sign-in → redirected to `/dashboard`
- [ ] Select timeframe → click Scan → sender cards stream in progressively
- [ ] AI summaries fill in after cards appear
- [ ] Click Unsubscribe on a card → button changes state based on result
- [ ] Sign out → redirected to landing page
- [ ] Visit `/dashboard` directly without signing in → redirected to landing page
- [ ] Resize browser to mobile width → layout remains usable

---

## Running All Tests

```bash
npm test
```
Expected: All test suites pass. If any fail, fix before deploying.
```

