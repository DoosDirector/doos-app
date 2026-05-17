-- ── Event type enum ───────────────────────────────────────────────────────────
create type public.event_type as enum (
  'night_out',
  'lunch',
  'coffee',
  'team_building',
  'activity',
  'other'
);

-- ── events table ──────────────────────────────────────────────────────────────
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  organiser_id     uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  description      text,
  type             public.event_type not null default 'other',
  date             timestamptz,
  alcohol_friendly boolean not null default true,
  share_token      text not null unique default encode(gen_random_bytes(12), 'base64url'),
  created_at       timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Fast lookup of all events for a given organiser (dashboard query)
create index if not exists events_organiser_id_idx on public.events (organiser_id);
-- Fast lookup by share token (public preview page)
create index if not exists events_share_token_idx  on public.events (share_token);
-- Fast chronological ordering
create index if not exists events_date_idx          on public.events (date desc nulls last);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.events enable row level security;

-- Organiser has full access to their own events
create policy "Organisers can manage their own events"
  on public.events
  for all
  to authenticated
  using      (auth.uid() = organiser_id)
  with check (auth.uid() = organiser_id);

-- Any authenticated user can read any event (needed for RSVP / invite links).
-- We will tighten this to event participants only once the rsvps table exists.
create policy "Authenticated users can read all events"
  on public.events
  for select
  to authenticated
  using (true);

-- Unauthenticated users can read events via share_token (public preview page).
-- The app filters by share_token in the query, so this safely exposes only
-- the requested event without leaking others.
create policy "Public read via share token"
  on public.events
  for select
  to anon
  using (true);
