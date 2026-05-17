-- ── RSVP status enum ─────────────────────────────────────────────────────────
create type public.rsvp_status as enum ('yes', 'no', 'maybe');

-- ── Drinking preference reuses the same yes/no/maybe shape ───────────────────
create type public.drinking_preference as enum ('yes', 'no', 'maybe');

-- ── rsvps table ───────────────────────────────────────────────────────────────
create table if not exists public.rsvps (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  status              public.rsvp_status not null default 'maybe',
  drinking_preference public.drinking_preference not null default 'maybe',
  created_at          timestamptz not null default now(),

  -- One RSVP per user per event
  constraint rsvps_user_event_uniq unique (user_id, event_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Fast fetch of all RSVPs for an event (attendee list, RSVP summary strip)
create index if not exists rsvps_event_id_idx on public.rsvps (event_id);

-- Fast fetch of all events a user has RSVPd to (dashboard)
create index if not exists rsvps_user_id_idx on public.rsvps (user_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.rsvps enable row level security;

-- Authenticated users can read all RSVPs for events they can see
create policy "Authenticated users can read RSVPs"
  on public.rsvps
  for select
  to authenticated
  using (true);

-- Users can insert an RSVP only as themselves
create policy "Users can insert their own RSVP"
  on public.rsvps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update only their own RSVP
create policy "Users can update their own RSVP"
  on public.rsvps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete only their own RSVP
create policy "Users can delete their own RSVP"
  on public.rsvps
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Anon users can read RSVPs via share link (to show attendee count publicly)
create policy "Anon users can read RSVPs"
  on public.rsvps
  for select
  to anon
  using (true);
