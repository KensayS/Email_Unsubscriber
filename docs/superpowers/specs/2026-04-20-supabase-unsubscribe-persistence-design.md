# Supabase Unsubscribe Persistence Design

**Date:** 2026-04-20  
**Feature:** Per-user unsubscribe history persistence across sessions  
**Status:** Approved

---

## Overview

Add Supabase database to store which senders each user has unsubscribed from. Across sessions, previously unsubscribed senders are filtered from scan results and archived in a separate "Unsubscribed" tab. This provides persistent unsubscribe history without re-scanning the same senders.

---

## Requirements

- Store unsubscribe records per user (identified by Google user ID from NextAuth)
- Filter scan results to exclude previously unsubscribed senders
- Display all unsubscribed senders in a separate "Unsubscribed" tab
- Records are permanent and read-only (no re-subscribe capability)
- Keep unsubscribe history forever (no expiration/cleanup)
- Secure data with RLS so users see only their own records

---

## Data Model

### `user_unsubscribes` Table

```sql
CREATE TABLE user_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_user_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  unsubscribed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_unsubscribe UNIQUE (google_user_id, sender_email)
);

CREATE INDEX idx_user_unsubscribes_user_id 
  ON user_unsubscribes(google_user_id);
CREATE INDEX idx_user_unsubscribes_lookup 
  ON user_unsubscribes(google_user_id, sender_email);
```

**Columns:**
- `id` — unique identifier for each record
- `google_user_id` — Google OAuth user ID from NextAuth session (user identifier)
- `sender_email` — sender's email address
- `sender_name` — sender's display name
- `unsubscribed_at` — date when user unsubscribed
- `created_at` — timestamp when record was created

**Indexes:**
- `(google_user_id)` — fast lookup of all unsubscribes for a user
- `(google_user_id, sender_email)` — fast lookup to check if specific sender is unsubscribed

**UNIQUE constraint:** Prevents duplicate unsubscribe records for same user+email pair

---

## Architecture

### API Endpoints

**New: `POST /api/unsubscribe/log`**
- Called after successful unsubscribe (POST, email, or URL action)
- Inserts record into `user_unsubscribes` table
- Payload: `{ sender_email, sender_name, unsubscribed_at }`
- Returns: success/error response
- Auth: requires valid NextAuth session

### Modified Scan Flow

1. Fetch Gmail senders as usual (from `/api/scan/stream`)
2. After scan completes, query `user_unsubscribes` for current user
3. Filter: remove any sender whose email is in unsubscribed list
4. Display filtered results in Grid/List view

### Unsubscribed Tab

New UI tab in dashboard showing:
- All unsubscribed senders for current user (sorted by unsubscribed_at DESC)
- Columns: sender name, sender email, unsubscribe date
- Read-only display (no actions)
- Timeframe selector hidden (shows all-time history)

---

## Data Flow

```
1. User signs in
   └─> NextAuth provides google_user_id in session

2. User scans inbox
   └─> Fetch Gmail senders
   └─> Query Supabase: SELECT sender_email FROM user_unsubscribes WHERE google_user_id = ?
   └─> Filter: remove senders in unsubscribed list
   └─> Display remaining senders in Grid/List view

3. User clicks Unsubscribe button
   └─> Execute unsubscribe action (POST, email, or URL)
   └─> On success: POST /api/unsubscribe/log with sender_email, sender_name, unsubscribed_at
   └─> Insert record into user_unsubscribes
   └─> Sender removed from scan view (UI state update)

4. User clicks Unsubscribed tab
   └─> Query Supabase: SELECT * FROM user_unsubscribes WHERE google_user_id = ? ORDER BY unsubscribed_at DESC
   └─> Display results in read-only table/card view
```

---

## Security

### Row Level Security (RLS)

**Policy 1: SELECT — Users can read only their own records**
```sql
CREATE POLICY "Users can read own unsubscribes"
  ON user_unsubscribes
  FOR SELECT
  USING (google_user_id = auth.uid());
```

**Policy 2: INSERT — Users can only insert their own records**
```sql
CREATE POLICY "Users can insert own unsubscribes"
  ON user_unsubscribes
  FOR INSERT
  WITH CHECK (google_user_id = auth.uid());
```

**Policy 3: DELETE/UPDATE — Disabled (read-only, permanent records)**

### Authentication

NextAuth JWT includes Google user ID as `sub` claim. Supabase validates JWT and maps `auth.uid()` to this value, enabling RLS to work automatically.

---

## UI Changes

### Dashboard Navigation

Add tab switcher:
- **Grid/List** (existing) — scan results with status filters
- **Unsubscribed** (new) — archived unsubscribes, read-only
- Tab content switches between scan view and unsubscribed view

### Scan Results

No visual changes to Grid/SenderListView components. Filtering happens before rendering:
- Scan fetches senders from Gmail
- App filters out unsubscribed emails
- Only "new" senders appear in Grid/List view

### Unsubscribed Tab

Simple table or card list:
- Columns: Name | Email | Unsubscribed Date
- Sorted by date (newest first)
- No actions (read-only)
- No timeframe selector (shows all-time)

---

## Implementation Considerations

### Database Queries

**Fetch unsubscribed list (per scan):**
```sql
SELECT sender_email FROM user_unsubscribes 
WHERE google_user_id = $1
```

**Insert unsubscribe:**
```sql
INSERT INTO user_unsubscribes (google_user_id, sender_email, sender_name, unsubscribed_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT DO NOTHING
```

**Fetch for Unsubscribed tab:**
```sql
SELECT sender_name, sender_email, unsubscribed_at 
FROM user_unsubscribes 
WHERE google_user_id = $1
ORDER BY unsubscribed_at DESC
```

### Performance Notes

- Filter in-memory on the client after fetching unsubscribed list (not in SQL query)
- Indexes on `google_user_id` ensure fast lookups
- UNIQUE constraint prevents duplicate records

### Error Handling

- If `/api/unsubscribe/log` fails, log error but don't block UI (unsubscribe already happened in Gmail)
- If fetch of unsubscribed list fails during scan, show error and prevent filtering (safe: shows all senders)
- If fetch for Unsubscribed tab fails, show error message in UI

---

## Success Criteria

✅ Unsubscribe records persisted to Supabase  
✅ Scan results filtered to exclude previously unsubscribed senders  
✅ Unsubscribed tab displays all archived unsubscribes  
✅ RLS enforces data isolation per user  
✅ Records are permanent (no re-subscribe)  
✅ No database schema changes needed after initial setup  

---

## Future Considerations

- Could add unsubscribe statistics dashboard (trends, top unsubscribed senders)
- Could add export of unsubscribe history
- Could add bulk operations (clear all, export CSV)
- But NOT in scope for this feature
