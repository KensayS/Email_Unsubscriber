# Sender Summary: Subject Snippet Design

**Date:** 2026-04-18  
**Status:** Approved

## Context

The original implementation plan used Gemini 1.5 Flash to generate a one-sentence AI summary per sender, with a 4.5s delay between calls to respect the 15 RPM free tier limit. With 50 senders that's ~3.75 minutes of post-scan waiting. The user's requirement is simply "enough for the user to know what kind of emails are sent" — AI quality is not needed, instant availability is preferred. Gemini is removed entirely.

## What We're Building

Display the sender's own subject lines as a snippet inside `SenderCard`. The first 2 subject lines from `sender.subjects` are joined with ` · ` and shown as muted text below the sender email address. This directly answers "what do they send?" with zero latency, zero API cost, and zero complexity.

**Display format:**
```
"Sale: 50% off everything" · "New Spring arrivals"
```

**Fallback:** If `sender.subjects` is empty, show the domain extracted from `sender.email` (e.g., `nike.com`).

Subjects are already collected in `SenderInfo` during the Gmail scan (up to 5), so they arrive with the first SSE pass — no second pass, no async wait.

## Architecture

### Removed entirely
- `lib/gemini.ts` — AI summary generation
- `__tests__/lib/gemini.test.ts` — Gemini tests
- SSE route Pass 2 — the loop that called Gemini with 4.5s sleeps
- `{ type: 'summary', email: string; summary: string }` from `StreamEvent`
- `summaries: Record<string, string>` state in `DashboardClient`
- `summary?: string` prop on `SenderCard`
- `GEMINI_API_KEY` from env docs and `.env.example`
- `@google/generative-ai` package dependency (can be removed from `package.json`)

### Modified

**`types/index.ts`**  
Remove `{ type: 'summary'; email: string; summary: string }` from `StreamEvent`. The union becomes:
```ts
export type StreamEvent =
  | { type: 'sender'; data: SenderInfo }
  | { type: 'done' }
  | { type: 'error'; message: string }
```

**`app/api/scan/stream/route.ts`**  
Remove Gemini imports (`generateSummary`, `sleep`, `RATE_LIMIT_DELAY_MS`). Remove Pass 2 loop entirely. Route now: fetch senders → stream all sender events → stream `done`.

**`components/sender-card.tsx`**  
Remove `summary` prop and skeleton. Add subject snippet display:
```tsx
const snippet = sender.subjects.slice(0, 2).join(' · ')
  || sender.email.split('@')[1] // domain fallback
```
Show as `<p className="text-sm text-muted-foreground truncate">{snippet}</p>`.

**`components/dashboard-client.tsx`**  
Remove `summaries` state, `setSummaries`, and `summary={summaries[sender.email]}` prop on `SenderCard`.

**`__tests__/components/sender-card.test.tsx`**  
Replace skeleton/summary tests with subject snippet tests:
- Shows first 2 subjects joined with ` · `
- Falls back to domain when subjects is empty

**`.env.example`**  
Remove `GEMINI_API_KEY` line.

**`CLAUDE.md`** (Task 15 in the implementation plan)  
Remove Gemini from stack, remove `GEMINI_API_KEY` from env vars section, update SSE streaming description (no summary events).

**`docs/superpowers/plans/2026-04-18-gmail-unsubscriber.md`**  
- Task 7 (Gemini Library): Replace with subject snippet helper in `lib/summary.ts` — a pure function `buildSubjectSnippet(subjects: string[], email: string): string`
- Task 8 (SSE route): Remove Pass 2 code
- Task 11 (SenderCard): Update tests and implementation
- Task 14 (Dashboard): Remove summaries state

## Data Flow

```
Gmail API → fetchSenders() → SenderInfo[] (includes subjects[])
         → SSE: stream { type: 'sender', data } for each
         → SSE: stream { type: 'done' }

Client: SenderCard receives sender.subjects directly
        → buildSubjectSnippet() runs synchronously
        → snippet displayed immediately, no loading state
```

## Verification

1. `npm test` — all tests pass (sender-card tests updated, gemini tests removed)
2. Run dev server, complete a scan — sender cards show subject snippets immediately on load, no loading skeleton, no delay after cards appear
3. Verify a sender with no subjects shows domain fallback (e.g. `github.com`)
4. Verify `GEMINI_API_KEY` is not referenced anywhere in the codebase (`grep -r GEMINI_API_KEY .`)
