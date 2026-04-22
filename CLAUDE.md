@AGENTS.md
# Email Unsubscriber — Claude Code Context

## What This Is
A Next.js 16 web app where users sign in with Google OAuth, scan their Gmail inbox for mailing lists, and unsubscribe in one click. Unsubscribe history is persisted in Supabase.

## Stack
- **Framework:** Next.js 16 App Router + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (components in `components/ui/`)
- **Auth:** NextAuth.js v4 with JWT session strategy (`lib/auth.ts`)
- **Database:** Supabase PostgreSQL for `user_unsubscribes` table (RLS policies enabled)
- **Gmail:** googleapis package (`lib/gmail.ts`) for inbox scanning and unsubscribe requests
- **Summaries:** Rule-based subject snippet helper (`lib/summary.ts`) — no AI/Gemini
- **Hosting:** Vercel (auto-deploys on push to master)

## Environment Variables
All required in `.env.local` (see `.env.example`):
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally, your Vercel URL in production
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console → APIs & Services → Credentials. Enable Gmail API. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (publishable, exposed to browser)
- `SUPABASE_SECRET_KEY` — Supabase service role key (server-only, for RLS bypass in API routes)

## Key Patterns

### Streaming Scan (SSE)
`/api/scan/stream` returns `text/event-stream` with JSON events:
- `{ type: "sender", data: SenderInfo }` — found sender (includes email count and subjects)
- `{ type: "done" }` — scan complete; fetches unsubscribed emails from DB and filters senders
- `{ type: "error", message: string }` — scan failed

Client reads stream in `components/dashboard-client.tsx` via `ReadableStream` + `TextDecoder`.

### Unsubscribe Priority
`lib/unsubscribe.ts` → `buildUnsubscribeAction()` — tries in order:
1. `List-Unsubscribe-Post` header + URL → HTTP POST (RFC 8058 one-click)
2. `List-Unsubscribe` mailto → send email via Gmail API
3. `List-Unsubscribe` URL only → return URL for user to click
4. Nothing found → `not_found`

On success, `/api/unsubscribe/log` records the unsubscribe in Supabase `user_unsubscribes` table.

### Auth & Session
- Access token stored in JWT cookie only (never sent to browser)
- Retrieved server-side with `getServerSession(authOptions)`
- Gmail scopes: `gmail.readonly` + `gmail.send`
- Unauthenticated users accessing `/dashboard` are redirected to `/` (home)
- Session max age: 55 minutes (matches Google access token lifetime)

### Types
All shared types in `types/index.ts`. NextAuth JWT/Session extensions in `types/next-auth.d.ts`.

## Dashboard Features

### List View (only view)
Table layout showing mailing list senders with:
- Sender name and email
- Count of emails from that sender
- "See details" button → opens modal with email subjects
- "Unsubscribe" button → one-click unsubscribe

Implemented in `components/sender-list-view.tsx` + modal in `components/sender-details-modal.tsx`.

### Tab Switcher
Appears after scan completes (only if senders found):
- **Scan Results:** Shows senders from latest scan (filtered to exclude already-unsubscribed)
- **Unsubscribed:** Shows all unsubscribed senders (loads from DB)

Implemented in `components/dashboard-client.tsx` header.

### Mobile UX
- Hamburger menu (≡) slides in from right with theme toggle + sign out
- Hamburger positioned with 6px left margin for breathing room
- Scan button and timeframe selector always visible on mobile
- Responsive list table (hides email column on mobile, shows in modal)

### Unsubscribe Status Flow
Button state managed locally:
1. `idle` — clickable "Unsubscribe"
2. `loading` — disabled "Unsubscribing…"
3. Result status — shows outcome (unsubscribed, already_unsubscribed, open_link, finish_in_new_tab, not_found)

URLs are stored separately and opened when status is `open_link` or `finish_in_new_tab`.

## Gmail Query & Filtering
- **Query:** `list:* after:YYYY/MM/DD` (finds mailing lists across all Gmail labels/categories)
- **Date format:** YYYY/MM/DD (Gmail API requirement, not Unix)
- **Minimum threshold:** Only returns senders with 2+ emails (filters one-off promotional mail)
- **Header validation:** Confirms `List-Unsubscribe` header present on each email
- **Scan filtering:** After scan completes, queries Supabase for already-unsubscribed senders and removes them from results

Implemented in `lib/gmail.ts` → `fetchSenders()`.

## Supabase Integration

### Table: `user_unsubscribes`
```sql
id, google_user_id, sender_email, sender_name, unsubscribed_at, created_at
```
- **RLS policy:** Users can only read/insert their own records (filtered by `google_user_id`)
- **Indexed on:** `google_user_id` for fast lookups

### API Routes
- `POST /api/unsubscribe/log` — Logs unsubscribe to DB after successful unsubscribe
- `GET /api/unsubscribes` — Fetches user's unsubscribe history for "Unsubscribed" tab

Supabase client (`lib/supabase.ts`) uses service role key in API routes for RLS bypass.

## Timeframe Selection
Scan 1 or 3 months of emails. 3-month scans take significantly longer.

## Landing Page
- Hero section with call-to-action
- Mock dashboard preview showing current UI (list view, header, tab switcher)
- Reflects actual app design for accuracy

## Running Locally
```bash
npm run dev      # http://localhost:3001 (if 3000 in use)
npm test         # run Jest tests
npm run lint     # run ESLint
npm run build    # verify production build
npm start        # run production server
```

## Deploying to Vercel
1. Push to master branch on GitHub
2. Vercel auto-deploys on push
3. Set env vars in Vercel → Settings → Environment Variables:
   - All `NEXTAUTH_*`, `GOOGLE_*`, `SUPABASE_*` variables
4. Update `NEXTAUTH_URL` to Vercel deployment URL
5. Add Vercel URL to Google Cloud Console → OAuth redirect URIs
