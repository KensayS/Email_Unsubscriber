@AGENTS.md
# Email Unsubscriber — Claude Code Context

## What This Is
A Next.js 16 web app where users sign in with Google OAuth, scan their Gmail inbox for mailing lists, and unsubscribe in one click. No database. No persistent storage. Session-based only.

## Stack
- **Framework:** Next.js 16 App Router + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (components in `components/ui/`)
- **Auth:** NextAuth.js v4 (`lib/auth.ts` holds `authOptions`)
- **Gmail:** googleapis package (`lib/gmail.ts`)
- **Summaries:** Rule-based subject snippet helper (`lib/summary.ts`) — no AI/Gemini
- **Hosting:** Vercel (free tier)

## Environment Variables
All required in `.env.local` (see `.env.example`):
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally, your Vercel URL in production
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console → APIs & Services → Credentials. Enable Gmail API. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.

## Key Patterns

### Streaming Scan (SSE)
`/api/scan/stream` returns a `text/event-stream` response. Events are JSON:
- `{ type: "sender", data: SenderInfo }` — streamed as senders are found; subjects are included in SenderInfo
- `{ type: "done" }` — scan complete
- `{ type: "error", message: string }` — something failed

Client reads this stream in `components/dashboard-client.tsx` using `ReadableStream` + `TextDecoder`. `SenderCard` calls `buildSubjectSnippet(sender.subjects, sender.email)` synchronously — no loading state needed.

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
