-- ── poll_options table ────────────────────────────────────────────────────────
create table if not exists public.poll_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.poll_questions (id) on delete cascade,
  option_text   text not null,
  created_at    timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists poll_options_question_id_idx
  on public.poll_options (question_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.poll_options enable row level security;

-- Organisers can manage options for questions on their own events
create policy "Organisers can manage poll options for their events"
  on public.poll_options
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.poll_questions q
      join public.events e on e.id = q.event_id
      where q.id = poll_options.question_id
        and e.organiser_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.poll_questions q
      join public.events e on e.id = q.event_id
      where q.id = poll_options.question_id
        and e.organiser_id = auth.uid()
    )
  );

-- Authenticated users can read options (to display polls and cast votes)
create policy "Authenticated users can read poll options"
  on public.poll_options
  for select
  to authenticated
  using (true);

-- Anon users can read options via share link
create policy "Anon users can read poll options"
  on public.poll_options
  for select
  to anon
  using (true);
