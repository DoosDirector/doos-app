-- ── Media type enum ───────────────────────────────────────────────────────────
create type public.media_type as enum ('image', 'video');

-- ── memories table ────────────────────────────────────────────────────────────
create table if not exists public.memories (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  uploader_id  uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,           -- path within Supabase Storage bucket
  media_type   public.media_type not null,
  caption      text,
  created_at   timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Primary access pattern: fetch all memories for an event, newest first
create index if not exists memories_event_id_created_at_idx
  on public.memories (event_id, created_at desc);

-- Fast lookup of everything a user has uploaded (for delete/manage flows)
create index if not exists memories_uploader_id_idx
  on public.memories (uploader_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.memories enable row level security;

-- Authenticated users can read all memories for events they can see
create policy "Authenticated users can read memories"
  on public.memories
  for select
  to authenticated
  using (true);

-- Users can upload memories only as themselves
create policy "Users can insert their own memories"
  on public.memories
  for insert
  to authenticated
  with check (auth.uid() = uploader_id);

-- Uploader can update their own memory (e.g. edit caption)
create policy "Uploaders can update their own memories"
  on public.memories
  for update
  to authenticated
  using (auth.uid() = uploader_id)
  with check (auth.uid() = uploader_id);

-- Uploader OR event organiser can delete a memory
create policy "Uploaders and organisers can delete memories"
  on public.memories
  for delete
  to authenticated
  using (
    auth.uid() = uploader_id
    or exists (
      select 1 from public.events e
      where e.id = memories.event_id
        and e.organiser_id = auth.uid()
    )
  );

-- Anon users can read memories via share link
create policy "Anon users can read memories"
  on public.memories
  for select
  to anon
  using (true);
