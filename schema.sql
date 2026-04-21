-- schema.sql
-- Run this in the Supabase SQL editor to create the required table.

create table if not exists user_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  google_user_id text not null,
  sender_email text not null,
  sender_name text not null,
  unsubscribed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (google_user_id, sender_email)
);

-- Index for fast lookups by user
create index if not exists idx_user_unsubscribes_google_user_id
  on user_unsubscribes (google_user_id);

-- RLS: users can only read their own records (used by the publishable key client)
alter table user_unsubscribes enable row level security;

create policy "Users can read own unsubscribes"
  on user_unsubscribes for select
  using (google_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
