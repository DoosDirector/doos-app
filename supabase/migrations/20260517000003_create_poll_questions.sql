-- ── Poll question type enum ───────────────────────────────────────────────────
create type public.question_type as enum (
  'venue',
  'date',
  'activity',
  'other'
);

-- ── poll_questions table ──────────────────────────────────────────────────────
create table if not exists public.poll_questions (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  question_text text not null,
  question_type public.question_type not null default 'other',
  created_at    timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Primary access pattern: fetch all questions for an event
create index if not exists poll_questions_event_id_idx
  on public.poll_questions (event_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.poll_questions enable row level security;

-- Organisers can manage poll questions for their own events
create policy "Organisers can manage poll questions for their events"
  on public.poll_questions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = poll_questions.event_id
        and e.organiser_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = poll_questions.event_id
        and e.organiser_id = auth.uid()
    )
  );

-- Authenticated users can read poll questions (to vote and view results)
create policy "Authenticated users can read poll questions"
  on public.poll_questions
  for select
  to authenticated
  using (true);

-- Anon users can read poll questions via share link
create policy "Anon users can read poll questions"
  on public.poll_questions
  for select
  to anon
  using (true);
