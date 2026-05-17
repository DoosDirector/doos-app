-- ── event_stops table ─────────────────────────────────────────────────────────
create table if not exists public.event_stops (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  place_id   text,                      -- Google Maps Place ID (nullable for custom stops)
  name       text not null,
  address    text,
  lat        double precision not null,
  lng        double precision not null,
  "order"    integer not null default 0, -- display/route order within the event
  created_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Primary access pattern: fetch all stops for an event in route order
create index if not exists event_stops_event_id_order_idx
  on public.event_stops (event_id, "order" asc);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.event_stops enable row level security;

-- Organisers can manage stops for their own events
create policy "Organisers can manage stops for their events"
  on public.event_stops
  for all
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_stops.event_id
        and e.organiser_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_stops.event_id
        and e.organiser_id = auth.uid()
    )
  );

-- Authenticated users can read stops (to view the map)
create policy "Authenticated users can read event stops"
  on public.event_stops
  for select
  to authenticated
  using (true);

-- Anon users can read stops via share link
create policy "Anon users can read event stops"
  on public.event_stops
  for select
  to anon
  using (true);
